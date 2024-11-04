package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sky.constant.StatusConstant;
import com.sky.entity.Orders;
import com.sky.entity.User;
import com.sky.mapper.DishMapper;
import com.sky.mapper.OrderMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.mapper.UserMapper;
import com.sky.service.WorkspaceService;
import com.sky.vo.BusinessDataVO;
import com.sky.vo.DishOverViewVO;
import com.sky.vo.OrderOverViewVO;
import com.sky.vo.SetmealOverViewVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WorkspaceServiceImpl implements WorkspaceService {

    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private DishMapper dishMapper;
    @Autowired
    private SetmealMapper setmealMapper;

    /**
     * 根据时间段统计营业数据
     * @param begin
     * @param end
     * @return
     */
    public BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end) {
        /**
         * 营业额：当日已完成订单的总金额
         * 有效订单：当日已完成订单的数量
         * 订单完成率：有效订单数 / 总订单数
         * 平均客单价：营业额 / 有效订单数
         * 新增用户：当日新增用户的数量
         */

        Map map = new HashMap();
        map.put("begin",begin);
        map.put("end",end);

        //查询总订单数
        LambdaQueryWrapper<Orders> ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper.gt(Orders::getOrderTime,begin)
                .lt(Orders::getOrderTime,end);
        Integer totalOrderCount = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        map.put("status", Orders.COMPLETED);
        //营业额
        Double turnover = orderMapper.sumByMap(map);
        turnover = turnover == null? 0.0 : turnover;

        //有效订单数
        ordersLambdaQueryWrapper.eq(Orders::getStatus,Orders.COMPLETED);

        Integer validOrderCount =  orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        Double unitPrice = 0.0;

        Double orderCompletionRate = 0.0;
        if(totalOrderCount != 0 && validOrderCount != 0){
            //订单完成率
            orderCompletionRate = validOrderCount.doubleValue() / totalOrderCount;
            //平均客单价
            unitPrice = turnover / validOrderCount;
        }

        //新增用户数
        LambdaQueryWrapper<User> userLambdaQueryWrapper=new LambdaQueryWrapper<>();
        userLambdaQueryWrapper.gt(User::getCreateTime,begin)
                .lt(User::getCreateTime,end);
        Integer newUsers = userMapper.selectCount(userLambdaQueryWrapper).intValue();

        return BusinessDataVO.builder()
                .turnover(turnover)
                .validOrderCount(validOrderCount)
                .orderCompletionRate(orderCompletionRate)
                .unitPrice(unitPrice)
                .newUsers(newUsers)
                .build();
    }


    /**
     * 查询订单管理数据
     *
     * @return
     */
    public OrderOverViewVO getOrderOverView() {


        //待接单
        LambdaQueryWrapper<Orders> ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper.eq(Orders::getStatus,Orders.TO_BE_CONFIRMED)
                .gt(Orders::getOrderTime,LocalDateTime.now().with(LocalTime.MIN));
        Integer waitingOrders = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        //待派送
        ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper.eq(Orders::getStatus,Orders.CONFIRMED)
                .gt(Orders::getOrderTime,LocalDateTime.now().with(LocalTime.MIN));
        Integer deliveredOrders = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        //已完成
        ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper.eq(Orders::getStatus,Orders.COMPLETED)
                .gt(Orders::getOrderTime,LocalDateTime.now().with(LocalTime.MIN));
        Integer completedOrders = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        //已取消
        ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper.eq(Orders::getStatus,Orders.CANCELLED)
                .gt(Orders::getOrderTime,LocalDateTime.now().with(LocalTime.MIN));
        Integer cancelledOrders = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        //全部订单
        ordersLambdaQueryWrapper=new LambdaQueryWrapper<>();
        ordersLambdaQueryWrapper
                .gt(Orders::getOrderTime,LocalDateTime.now().with(LocalTime.MIN));
        Integer allOrders = orderMapper.selectCount(ordersLambdaQueryWrapper).intValue();

        return OrderOverViewVO.builder()
                .waitingOrders(waitingOrders)
                .deliveredOrders(deliveredOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .allOrders(allOrders)
                .build();
    }

    /**
     * 查询菜品总览
     *
     * @return
     */
    public DishOverViewVO getDishOverView() {
        Map map = new HashMap();
        map.put("status", StatusConstant.ENABLE);
        Integer sold = dishMapper.countByMap(map);

        map.put("status", StatusConstant.DISABLE);
        Integer discontinued = dishMapper.countByMap(map);

        return DishOverViewVO.builder()
                .sold(sold)
                .discontinued(discontinued)
                .build();
    }

    /**
     * 查询套餐总览
     *
     * @return
     */
    public SetmealOverViewVO getSetmealOverView() {
        Map map = new HashMap();
        map.put("status", StatusConstant.ENABLE);
        Integer sold = setmealMapper.countByMap(map);

        map.put("status", StatusConstant.DISABLE);
        Integer discontinued = setmealMapper.countByMap(map);

        return SetmealOverViewVO.builder()
                .sold(sold)
                .discontinued(discontinued)
                .build();
    }
}
