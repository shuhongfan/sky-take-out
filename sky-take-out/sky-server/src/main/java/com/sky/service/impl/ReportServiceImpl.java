package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sky.dto.GoodsSalesDTO;
import com.sky.entity.Orders;
import com.sky.entity.User;
import com.sky.mapper.OrderDetailMapper;
import com.sky.mapper.OrderMapper;
import com.sky.mapper.UserMapper;
import com.sky.service.ReportServer;
import com.sky.service.WorkspaceService;
import com.sky.vo.*;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportServer {
    @Autowired
    OrderMapper orderMapper;
    @Autowired
    UserMapper userMapper;
    @Autowired
    OrderDetailMapper orderDetailMapper;
    @Autowired
    WorkspaceService workspaceService;
    @Override
    public TurnoverReportVO getTurnoverStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList=new ArrayList<>();
        List<Double> amountList=new ArrayList<>();
        while (begin.isBefore(end)){
            dateList.add(begin);
            begin=begin.plusDays(1);
        }
        dateList.add(end);



        dateList.forEach(date->{
            LocalDateTime localDateTimeBegin = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime localDateTimeEnd = LocalDateTime.of(date, LocalTime.MAX);
            Map map=new HashMap<>();
            map.put("begin",localDateTimeBegin);
            map.put("end",localDateTimeEnd);
            map.put("status",Orders.COMPLETED);
            Double turnover=orderMapper.sumByMap(map);
            turnover=turnover==null ? 0.0:turnover;
            amountList.add(turnover);
        });
        TurnoverReportVO turnoverReportVO = TurnoverReportVO.builder()
                .dateList(StringUtils.join(dateList, ","))
                .turnoverList(StringUtils.join(amountList, ","))
                .build();

        return turnoverReportVO;
    }

    @Override
    public UserReportVO getUserStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList=new ArrayList<>();
        List<Integer> allUserList=new ArrayList<>();
        List<Integer> newUserList=new ArrayList<>();
        while (begin.isBefore(end)){
            dateList.add(begin);
            begin=begin.plusDays(1);
        }
        dateList.add(end);



        dateList.forEach(date->{
            LocalDateTime localDateTimeBegin = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime localDateTimeEnd = LocalDateTime.of(date, LocalTime.MAX);
            LambdaQueryWrapper<User>queryWrapper=new LambdaQueryWrapper<>();
            queryWrapper.gt(User::getCreateTime,localDateTimeBegin)
                    .lt(User::getCreateTime,localDateTimeEnd);
            LambdaQueryWrapper<User>queryWrapper2=new LambdaQueryWrapper<>();
            queryWrapper2.lt(User::getCreateTime,localDateTimeEnd);
            int today= userMapper.selectCount(queryWrapper).intValue();
            int all= userMapper.selectCount(queryWrapper2).intValue();
            allUserList.add(all);
            newUserList.add(today);

        });



        return UserReportVO.builder()
                .dateList(StringUtils.join(dateList,","))
                .newUserList(StringUtils.join(newUserList,","))
                .totalUserList(StringUtils.join(allUserList,","))
                .build();
    }

    @Override
    public OrderReportVO getOrdersStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList=new ArrayList<>();
        List<Integer> todayAllOrderList=new ArrayList<>();
        List<Integer> todayValidOrderList=new ArrayList<>();
        while (begin.isBefore(end)){
            dateList.add(begin);
            begin=begin.plusDays(1);
        }
        dateList.add(end);



        dateList.forEach(date->{
            LocalDateTime localDateTimeBegin = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime localDateTimeEnd = LocalDateTime.of(date, LocalTime.MAX);
            LambdaQueryWrapper<Orders>queryWrapper=new LambdaQueryWrapper<>();
            queryWrapper.gt(Orders::getOrderTime,localDateTimeBegin)
                    .lt(Orders::getOrderTime,localDateTimeEnd)
                    .eq(Orders::getStatus,Orders.COMPLETED);
            LambdaQueryWrapper<Orders>queryWrapper2=new LambdaQueryWrapper<>();
            queryWrapper2.gt(Orders::getOrderTime,localDateTimeBegin)
                    .lt(Orders::getOrderTime,localDateTimeEnd);
            int todayAll= orderMapper.selectCount(queryWrapper2).intValue();
            int todayValid= orderMapper.selectCount(queryWrapper).intValue();
            todayAllOrderList.add(todayAll);
            todayValidOrderList.add(todayValid);
        });
        Integer AllOrder = todayAllOrderList.stream().reduce(Integer::sum).get();
        Integer ValidOrder = todayValidOrderList.stream().reduce(Integer::sum).get();

        Double orderCompletionRate=0.0;
        if(AllOrder!=0){
            orderCompletionRate=ValidOrder.doubleValue()/AllOrder;
        }
        return OrderReportVO.builder()
                .dateList(StringUtils.join(dateList,","))
                .orderCountList(StringUtils.join(todayAllOrderList,","))
                .validOrderCountList(StringUtils.join(todayValidOrderList,","))
                .totalOrderCount(AllOrder)
                .validOrderCount(ValidOrder)
                .orderCompletionRate(orderCompletionRate)
                .build();
    }

    @Override
    public SalesTop10ReportVO getTop10(LocalDate begin, LocalDate end) {
        LocalDateTime localDateTimeBegin = LocalDateTime.of(begin, LocalTime.MIN);
        LocalDateTime localDateTimeEnd = LocalDateTime.of(end, LocalTime.MAX);
        List<GoodsSalesDTO> goodsSalesDTOS=orderDetailMapper.getTop10(localDateTimeBegin,localDateTimeEnd);
        List<String> nameList = goodsSalesDTOS.stream().map(GoodsSalesDTO::getName).collect(Collectors.toList());
        List<Integer> numberList = goodsSalesDTOS.stream().map(GoodsSalesDTO::getNumber).collect(Collectors.toList());


        return SalesTop10ReportVO.builder()
                .nameList(StringUtils.join(nameList,","))
                .numberList(StringUtils.join(numberList,","))
                .build();
    }

    @Override
    public void exportBusinessData(HttpServletResponse httpServletResponse) {

        LocalDate begin = LocalDate.now().minusDays(31);
        LocalDate end = LocalDate.now().minusDays(1);
        LocalDateTime localDateTimeBegin = LocalDateTime.of(begin, LocalTime.MIN);
        LocalDateTime localDateTimeEnd = LocalDateTime.of(end, LocalTime.MAX);
        BusinessDataVO businessData = workspaceService.getBusinessData(localDateTimeBegin, localDateTimeEnd);

        InputStream resourceAsStream = this.getClass().getClassLoader().getResourceAsStream("templates/运营数据报表模板.xlsx");
        try {
            XSSFWorkbook excel = new XSSFWorkbook(resourceAsStream);
            XSSFSheet sheet1 = excel.getSheet("Sheet1");
            sheet1.getRow(1).getCell(1).setCellValue("时间:"+begin+"至"+end);

            sheet1.getRow(3).getCell(2).setCellValue(businessData.getTurnover());
            sheet1.getRow(3).getCell(4).setCellValue(businessData.getOrderCompletionRate());
            sheet1.getRow(3).getCell(6).setCellValue(businessData.getNewUsers());
            sheet1.getRow(4).getCell(2).setCellValue(businessData.getValidOrderCount());
            sheet1.getRow(4).getCell(4).setCellValue(businessData.getUnitPrice());


            for (int i = 0; i < 30; i++) {
                begin = begin.plusDays(1);
                LocalDateTime dayBegin = LocalDateTime.of(begin, LocalTime.MIN);
                LocalDateTime dayEnd = LocalDateTime.of(begin, LocalTime.MAX);
                BusinessDataVO businessData1 = workspaceService.getBusinessData(dayBegin, dayEnd);
                sheet1.getRow(7+i).getCell(1).setCellValue(begin.toString());
                sheet1.getRow(7+i).getCell(2).setCellValue(businessData1.getTurnover());
                sheet1.getRow(7+i).getCell(3).setCellValue(businessData1.getValidOrderCount());
                sheet1.getRow(7+i).getCell(4).setCellValue(businessData1.getOrderCompletionRate());
                sheet1.getRow(7+i).getCell(5).setCellValue(businessData1.getUnitPrice());
                sheet1.getRow(7+i).getCell(6).setCellValue(businessData1.getNewUsers());
            }



            ServletOutputStream outputStream = httpServletResponse.getOutputStream();
            excel.write(outputStream);
            excel.close();
            outputStream.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
