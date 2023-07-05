// ******* Region MANAGER ******** //
$axure.internal(function($ax) {
    var _geometry = $ax.geometry = {};
    var regionMap = {};
    var regionList = [];

    var _unregister = function(label) {
        var regionIndex = regionList.indexOf(label);
        if(regionIndex != -1) {
            var end = $ax.splice(regionList, regionIndex + 1);
            $ax.splice(regionList, regionIndex, regionList.length - regionIndex);
            regionList = regionList.concat(end);
        }
        delete regionMap[label];
    };
    _geometry.unregister = _unregister;

    var clear = function() {
        regionMap = {};
        regionList = [];
    };

    var _polygonRegistered = function(label) {
        return Boolean(regionMap[label]);
    };
    _geometry.polygonRegistered = _polygonRegistered;

    // Must be counterclockwise, or enter/exit will be wrong
    var _registerPolygon = function(label, points, callback, info) {
        var regionIndex = regionList.indexOf(label);
        if(regionIndex == -1) regionList.push(label);
        regionMap[label] = { points: points, callback: callback, info: info };
    };
    _geometry.registerPolygon = _registerPolygon;

    var _getPolygonInfo = function(label) {
        if(!_polygonRegistered(label)) return undefined;
        return regionMap[label].info;
    };
    _geometry.getPolygonInfo = _getPolygonInfo;



    var _genRect = function(info, roundHalfPixel) {
        var x = info.pagex();
        var y = info.pagey();
        var w = info.width();
        var h = info.height();

        if(roundHalfPixel) {
            if(x % 1 != 0) {
                x = Math.floor(x);
                w++;
            }
            if(y % 1 != 0) {
                y = Math.floor(y);
                h++;
            }
        }

        var r = x + w;
        var b = y + h;

        var rect = {
            X: function() { return x; },
            Y: function() { return y; },
            Wigth: function() { return w; },
            Height: function() { return h; },
            Left: function() { return x; },
            Right: function() { return r; },
            Top: function() { return y; },
            Bottom: function() { return b; }
        };
        return rect;
    };
    _geometry.genRect = _genRect;

    var _genPoint = function(x, y) {
        return { x: x, y: y };
    };
    _geometry.genPoint = _genPoint;

    var oldPoint = _genPoint(0, 0);
    _geometry.tick = function(x, y, end) {
        var lastPoint = oldPoint;
        var nextPoint = oldPoint = _genPoint(x, y);
        var line = { p1: lastPoint, p2: nextPoint };
        if(!regionList.length) return;

        for(var i = 0; i < regionList.length; i++) {
            var region = regionMap[regionList[i]];
            var points = region.points;
            if(!region.checked) {
                if(!_checkInside(points, $ax.mouseLocation)) {
                    region.callback({ outside: true });
                    continue;
                }
                region.checked = true;
            }
            for(var j = 0; j < points.length; j++) {
                var startSegment = points[j];
                var endSegment = points[(j + 1) % points.length];
                var intersectInfo = linesIntersect(line, { p1: startSegment, p2: endSegment });
                if(intersectInfo) {
                    region.callback(intersectInfo);
                    break;
                }
            }
        }

        if(end) clear();
    };

    // Info if the one line touches the other (even barely), false otherwise
    // Info includes point, if l1 is entering or exiting l2, and any ties that happened, or parallel info
    var linesIntersect = function(l1, l2) {
        var retval = {};
        var ties = {};

        var l1p1 = l1.p1.x < l1.p2.x || (l1.p1.x == l1.p2.x && l1.p1.y < l1.p2.y) ? l1.p1 : l1.p2;
        var l1p2 = l1.p1.x < l1.p2.x || (l1.p1.x == l1.p2.x && l1.p1.y < l1.p2.y) ? l1.p2 : l1.p1;
        var m1 = (l1p2.y - l1p1.y) / (l1p2.x - l1p1.x);

        var l2p1 = l2.p1.x < l2.p2.x || (l2.p1.x == l2.p2.x && l2.p1.y < l2.p2.y) ? l2.p1 : l2.p2;
        var l2p2 = l2.p1.x < l2.p2.x || (l2.p1.x == l2.p2.x && l2.p1.y < l2.p2.y) ? l2.p2 : l2.p1;
        var m2 = (l2p2.y - l2p1.y) / (l2p2.x - l2p1.x);

        var l1Vert = l1.p1.x == l1.p2.x;
        var l2Vert = l2.p1.x == l2.p2.x;
        if(l1Vert || l2Vert) {
            if(l1Vert && l2Vert) {
                // If the lines don't follow the same path, return
                if(l1p1.x != l2p1.x) return false;
                // if they never meet, return
                if(l1p2.y < l2p1.y || l1p1.y > l2p2.y) return false;
                var firstVert = l1p1.y >= l2p1.y ? l1p1 : l2p1;
                var secondVert = l1p2.y <= l2p2.y ? l1p2 : l2p2;
                // First is from the perspective of l1
                retval.parallel = {
                    first: l1p1 == l1.p1 ? firstVert : secondVert,
                    second: l1p2 == l1.p2 ? secondVert : firstVert,
                    sameDirection: (l1p1 == l1.p1) == (l2p1 == l2.p1)
                };

                return retval;
            }

            var x1 = l2Vert ? l1p1.x : l2p1.x;
            var x2 = l2Vert ? l1p2.x : l2p2.x;
            var xVert = l2Vert ? l2p1.x : l1p1.x;

            var y = l2Vert ? l1p1.y + (xVert - x1) * m1 : l2p1.y + (xVert - x1) * m2;
            var y1 = l2Vert ? l2p1.y : l1p1.y;
            var y2 = l2Vert ? l2p2.y : l1p2.y;
            if(xVert >= x1 && xVert <= x2 && y >= y1 && y <= y2) {
                retval.point = { x: xVert, y: y };
                retval.exiting = l2Vert == (y1 == (l2Vert ? l2.p1.y : l1.p1.y)) == (x1 == (l2Vert ? l1.p1.x : l2.p1.x));
                retval.entering = !retval.exiting;

                // Calculate ties
                if(x1 == xVert) {
                    ties[l2Vert ? 'l1' : 'l2'] = (x1 == (l2Vert ? l1.p1.x : l2.p1.x)) ? 'start' : 'end';
                    retval.ties = ties;
                } else if(x2 == xVert) {
                    ties[l2Vert ? 'l1' : 'l2'] = (x2 == (l2Vert ? l1.p2.x : l2.p2.x)) ? 'end' : 'start';
                    retval.ties = ties;
                }
                if(y1 == y) {
                    ties[l2Vert ? 'l2' : 'l1'] = (y1 == (l2Vert ? l2.p1.y : l1.p1.y)) ? 'start' : 'end';
                    retval.ties = ties;
                } else if(y2 == y) {
                    ties[l2Vert ? 'l2' : 'l1'] = (y2 == (l2Vert ? l2.p2.y : l1.p2.y)) ? 'end' : 'start';
                    retval.ties = ties;
                }

                return retval;
            }
            return false;
        }
        // If here, no vertical lines

        if(m1 == m2) {
            // If the lines don't follow the same path, return
            if(l1p1.y != (l2p1.y + (l1p1.x - l2p1.x) * m1)) return false;
            // if they never meet, return
            if(l1p2.x < l2p1.x || l1p1.x > l2p2.x) return false;
            var first = l1p1.x >= l2p1.x ? l1p1 : l2p1;
            var second = l1p2.x <= l2p2.x ? l1p2 : l2p2;
            // First is from the perspective of l1
            retval.parallel = {
                first: l1p1 == l1.p1 ? first : second,
                second: l1p2 == l1.p2 ? second : first,
                sameDirection: (l1p1 == l1.p1) == (l2p1 == l2.p1)
            };

            return retval;
        }

        var x = (l2p1.y - l2p1.x * m2 - l1p1.y + l1p1.x * m1) / (m1 - m2);

        // Check if x is out of bounds
        if(x >= l1p1.x && x <= l1p2.x && x >= l2p1.x && x <= l2p2.x) {
            var y = l1p1.y + (x - l1p1.x) * m1;
            retval.point = { x: x, y: y };
            retval.entering = m1 > m2 == (l1p1 == l1.p1) == (l2p1 == l2.p1);
            retval.exiting = !retval.entering;

            // Calculate ties
            if(l1.p1.x == x) {
                ties.l1 = 'start';
                retval.ties = ties;
            } else if(l1.p2.x == x) {
                ties.l1 = 'end';
                retval.ties = ties;
            }
            if(l2.p1.x == x) {
                ties.l2 = 'start';
                retval.ties = ties;
            } else if(l2.p2.x == x) {
                ties.l2 = 'end';
                retval.ties = ties;
            }

            return retval;
        }
        return false;
    };

    var _checkInsideRegion = function(label, point) {
        if(!_polygonRegistered(label)) return false;

        return _checkInside(regionMap[label].points, point || $ax.mouseLocation);
    };
    _geometry.checkInsideRegion = _checkInsideRegion;

    // Returns true if point is inside the polygon, including ties
    var _checkInside = function(polygon, point) {
        // Make horizontal line wider than the polygon, with the y of point to test location
        var firstX = polygon[0].x;
        var secondX = firstX;
        var i;
        for(i = 1; i < polygon.length; i++) {
            var polyX = polygon[i].x;
            firstX = Math.min(firstX, polyX);
            secondX = Math.max(secondX, polyX);
        }
        var line = {
            p1: _genPoint(--firstX, point.y),
            p2: _genPoint(++secondX, point.y)
        };

        // If entered true, with closest intersection says you are inside the polygon.
        var entered = false;
        // Closest is the closest intersection to the left of the point
        var closest = line.p1.x;
        // This is for if intersections hit the same point, to find out which is correct
        var cos = -2;

        var getCos = function(line) {
            var x = line.p2.x - line.p1.x;
            var y = line.p2.y - line.p1.y;
            return x / Math.sqrt(x * x + y * y);
        };

        for(i = 0; i < polygon.length; i++) {
            var polyLine = { p1: polygon[i], p2: polygon[(i + 1) % polygon.length] };
            var intersectInfo = linesIntersect(line, polyLine);
            if(!intersectInfo) continue;

            if(intersectInfo.parallel) {
                // Only really care about this if it actually touches the point
                if(intersectInfo.parallel.first.x <= point.x && intersectInfo.parallel.second.x >= point.x) return true;
                continue;
            }

            var intersectionX = intersectInfo.point.x;
            if(intersectionX > point.x || intersectionX < closest) continue;
            if(intersectionX == point.x) return true;

            // If closer than last time, reset cosine.
            if(intersectionX != closest) cos = -2;

            // For getting cosine, need to possibly reverse the direction of polyLine.
            if(intersectInfo.ties) {
                // Tie must be on l2, if the ties is end, reverse so cosine indicates how close the angle is to that of 'point' from here.
                if(intersectInfo.ties.l2 == 'end') polyLine = { p1: polyLine.p2, p2: polyLine.p1 };
            } else {
                // It is on both side, so you can take the larger one
                if(polyLine.p1.x > polyLine.p2.x) polyLine = { p1: polyLine.p2, p2: polyLine.p1 };
            }
            var currCos = getCos(polyLine);
            if(currCos > cos) {
                cos = currCos;
                closest = intersectionX;
                entered = intersectInfo.entering;
            }
        }
        return entered;
    };
    _geometry.checkInside = _checkInside;
});