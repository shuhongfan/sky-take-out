package com.sky.controller.admin;

import com.sky.result.Result;
import com.sky.service.ReportServer;
import com.sky.vo.OrderReportVO;
import com.sky.vo.SalesTop10ReportVO;
import com.sky.vo.TurnoverReportVO;
import com.sky.vo.UserReportVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.time.LocalDate;

@RestController
@RequestMapping("/admin/report")
@Api(tags = "数据统计相关接口")
@Slf4j
public class ReportController {
    @Autowired
    ReportServer reportServer;

    @GetMapping("/turnoverStatistics")
    @ApiOperation("营业额统计")
    public Result turnoverStatistics(
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end){
        log.info("营业额数据统计:{},{}",begin,end);
        TurnoverReportVO turnoverReportVO=reportServer.getTurnoverStatistics(begin,end);

        return Result.success(turnoverReportVO);
    }


    @GetMapping("/userStatistics")
    @ApiOperation("用户统计")
    public Result userStatistics(
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end){
        log.info("用户数据统计:{},{}",begin,end);
        UserReportVO userReportVO=reportServer.getUserStatistics(begin,end);

        return Result.success(userReportVO);
    }
    @GetMapping("/ordersStatistics")
    @ApiOperation("订单统计")
    public Result ordersStatistics(
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end){
        log.info("订单统计:{},{}",begin,end);
        OrderReportVO orderReportVO=reportServer.getOrdersStatistics(begin,end);

        return Result.success(orderReportVO);
    }


    @GetMapping("/top10")
    @ApiOperation("销量排名统计")
    public Result top10(
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
            @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end){
        log.info("销量排名统计:{},{}",begin,end);
        SalesTop10ReportVO salesTop10ReportVO=reportServer.getTop10(begin,end);

        return Result.success(salesTop10ReportVO);
    }


    @GetMapping("/export")
    @ApiOperation("导出运营报表")
    public void export(HttpServletResponse httpServletResponse){

        reportServer.exportBusinessData(httpServletResponse);

    }
}
