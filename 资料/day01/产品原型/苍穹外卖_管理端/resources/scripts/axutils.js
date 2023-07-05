/*
 *
 *
 *
 *
 */

 (function() {
     // define the root namespace object
     if(!window.$axure) window.$axure = {};

     $axure.utils = {};

     // ------------------------------------------------------------------------
     // Makes an object bindable
     // ------------------------------------------------------------------------
     $axure.utils.makeBindable = function(obj, events) {
         if(obj.registeredBindings != null) return;

         // copy the events
         obj.bindableEvents = events.slice();
         obj.registeredBindings = {};

         obj.bind = function(eventName, fn) {
             var binding = {};
             binding.eventName = eventName;
             binding.action = fn;

             var bindingList = this.registeredBindings[eventName];
             if(bindingList == null) {
                 bindingList = [];
                 this.registeredBindings[eventName] = bindingList;
             }
             bindingList[bindingList.length] = binding;
         };

         obj.unbind = function(eventName) {
             if(eventName.indexOf('.') >= 0) {
                 this.registeredBindings[eventName] = null;
             } else {
                 var event = eventName.split('.')[0];
                 for(var bindingKey in this.registeredBindings) {
                     if(bindingKey.split('.')[0] == event) {
                         this.registeredBindings[bindingKey] = null;
                     }
                 }
             }
         };

         obj.triggerEvent = function(eventName, arg) {
             for(var bindingKey in this.registeredBindings) {
                 if(bindingKey.split('.')[0] == eventName) {
                     var bindings = this.registeredBindings[bindingKey];
                     for(var i = 0; i < bindings.length; i++) {
                         if(arg == null) {
                             bindings[i].action();
                         } else {
                             bindings[i].action(arg);
                         }
                     }
                 }
             }
         };
     };


     $axure.utils.loadCSS = function(url) {
         $('head').append('<link text="text/css" href="' + url + '" rel="Stylesheet" />');
     };

     $axure.utils.loadJS = function(url) {
         $('head').append('<script text="text/javascript" language="JavaScript" src="' + url + '"></script>');
     };

     $axure.utils.curry = function(fn) {
         var curriedArgs = Array.prototype.slice.call(arguments, [1]);
         return function() {
             fn.apply(this, curriedArgs.concat(Array.prototype.slice.call(arguments)));
         };
     };

     $axure.utils.succeeded = function(result) {
         return result && result.success;
     };

     $axure.utils.createUniqueTag = function() {
         return Math.random().toString().substring(2) +
             Math.random().toString().substring(2) +
                 Math.random().toString().substring(2) +
                     Math.random().toString().substring(2);
     };

     $axure.utils.formatDate = function(date) {
         var months = [
             "Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
         var hours = date.getHours();
         var amPm = (hours > 11 ? 'PM' : 'AM');
         hours = hours % 12;
         if(hours == '0') hours = '12';
         var minutes = date.getMinutes() + '';
         if(minutes.length == 1) {
             minutes = '0' + minutes;
         }
         return [
             months[date.getMonth()], ' ', date.getDate(), ' ', date.getFullYear(), ' ',
             hours, ':', minutes, ' ', amPm].join('');

     };

     $axure.utils.quickObject = function() {
         var returnVal = {};
         for(var i = 0; i < arguments.length; i += 2) {
             returnVal[arguments[i]] = arguments[i + 1];
         }
         return returnVal;
     };

     var matrixBase = {
         mul: function(val) {
             if(val.x !== undefined) {
                 return $axure.utils.Vector2D(
                     this.m11 * val.x + this.m12 * val.y + this.tx,
                     this.m21 * val.x + this.m22 * val.y + this.ty);
             } else if(val.m11) {
                 return $axure.utils.Matrix2D(
                     this.m11 * val.m11 + this.m12 * val.m21,
                     this.m11 * val.m12 + this.m12 * val.m22,
                     this.m21 * val.m11 + this.m22 * val.m21,
                     this.m21 * val.m12 + this.m22 * val.m22,
                     val.tx + this.tx * val.m11 + this.ty * val.m21,
                     val.ty + this.tx * val.m12 + this.ty * val.m22
                 );
             } else if(Number(val)) {
                 var num = Number(val);
                 return $axure.utils.Matrix2D(this.m11 * num, this.m12 * num,
                     this.m21 * num, this.m22 * num,
                     this.tx * num, this.ty * num);
             } else return undefined;
         },
         rotate: function(angle) {
             var angleRad = angle * Math.PI / 180;
             var c = Math.cos(angleRad);
             var s = Math.sin(angleRad);

             return this.mul($axure.utils.Matrix2D(c, -s, s, c));
         },
         translate: function(tx, ty) {
             return this.mul($axure.utils.Matrix2D(1, 0, 0, 1, tx, ty));
         }
     };

     $axure.utils.Matrix2D = function(m11, m12, m21, m22, tx, ty) {
         return $.extend({
             m11: m11 || 0,
             m12: m12 || 0,
             m21: m21 || 0,
             m22: m22 || 0,
             tx: tx || 0,
             ty: ty || 0
         }, matrixBase);
     };

     $axure.utils.Vector2D = function(x, y) {
         return { x: x || 0, y: y || 0 };
     };

     $axure.utils.Matrix2D.identity = function() {
         return $axure.utils.Matrix2D(1, 0, 0, 1, 0, 0);
     };

 })();

 // TODO: [mas] simplify this
 if(window.$axure && window.$axure.internal) {
     $axure.internal(function($ax) { $ax.utils = $axure.utils; });
 }

 // Its too much of a pain to escape everything and use regular expresions, just replace manually
 (function () {
     var original = String.prototype.replace;
     // TODO: maybe use flags or object instead to pass options in
     String.prototype.replace = function (search, newVal, replaceFirst, ignoreCase) {
         // Use original is some cases
         if (search instanceof RegExp) return original.apply(this, arguments);

         search = String(search);
         var searchCompare = ignoreCase ? this.toLowerCase() : this;
         if (ignoreCase) search = search.toLowerCase();

         var searchLength = search.length;
         var thisLength = this.length;

         var index = 0;
         var retVal = '';
         while (index != -1) {
             var nextIndex = searchCompare.indexOf(search, index);
             if (nextIndex != -1) {
                 retVal += this.substring(index, nextIndex) + newVal;
                 index = nextIndex + searchLength;
                 if (index >= thisLength) index = -1;
             } else {
                 retVal += this.substring(index);
                 index = -1;
             }
             if (replaceFirst) break;
         }

         return retVal;
     };

     if (!Array.prototype.indexOf) {
         Array.prototype.indexOf = function (elt /*, from*/) {
             var len = this.length >>> 0;

             var from = trunc(Number(arguments[1]) || 0);
             if(from < 0) from += len;

             for(; from < len; from++) {
                 if(from in this && this[from] === elt) return from;
             }
             return -1;
         };
     }

     var trunc = function(num) {
         return num < 0 ? Math.ceil(num) : Math.floor(num);
     };


 })();
