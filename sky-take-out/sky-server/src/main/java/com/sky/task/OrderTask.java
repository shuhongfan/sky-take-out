package com.sky.task;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.sky.entity.Orders;
import com.sky.mapper.OrderMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
public class OrderTask {
    @Autowired
    OrderMapper orderMapper;

    @Scheduled(cron = "0 * * * * ?  ")
//    @Scheduled(cron = "0/5 * * * * ?  ")
    public void processTimeoutOrder(){
        log.info("处理超时订单:{}",LocalDateTime.now());
        LambdaUpdateWrapper<Orders> ordersLambdaUpdateWrapper = new LambdaUpdateWrapper<>();
        ordersLambdaUpdateWrapper.eq(Orders::getStatus,Orders.PENDING_PAYMENT)
                .lt(Orders::getOrderTime, LocalDateTime.now().minusMinutes(15))
//                .lt(Orders::getOrderTime, LocalDateTime.now().minusMinutes(1))
                .set(Orders::getStatus,Orders.CANCELLED)
                .set(Orders::getCancelReason,"订单超时，自动取消")
                .set(Orders::getCancelTime,LocalDateTime.now());
        orderMapper.update(ordersLambdaUpdateWrapper);

    }

    @Scheduled(cron = "0 0 1 * * ? ")
//    @Scheduled(cron = "0/5 * * * * ?  ")
    public void processDeliveryOrder(){
        log.info("处理一直派送订单:{}",LocalDateTime.now());
        LambdaUpdateWrapper<Orders> ordersLambdaUpdateWrapper = new LambdaUpdateWrapper<>();
        ordersLambdaUpdateWrapper.eq(Orders::getStatus,Orders.DELIVERY_IN_PROGRESS)
                .lt(Orders::getOrderTime, LocalDateTime.now().minusHours(1))
//                .lt(Orders::getOrderTime, LocalDateTime.now().minusMinutes(1))
                .set(Orders::getStatus,Orders.COMPLETED)
                .set(Orders::getDeliveryTime,LocalDateTime.now())
                .set(Orders::getCancelTime,LocalDateTime.now());
        orderMapper.update(ordersLambdaUpdateWrapper);
    }
}
