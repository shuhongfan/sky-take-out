package com.sky.service.impl;

import com.sky.service.ShopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

@Service
public class ShopServiceImpl implements ShopService {
    private static final String SHOP_STATUS_KEY="SHOP_STATUS";
    @Autowired
    RedisTemplate redisTemplate;
    @Override
    public void setStatus(Integer status) {
        ValueOperations valueOperations = redisTemplate.opsForValue();
        valueOperations.set(SHOP_STATUS_KEY,status);
    }

    @Override
    public Integer getStatus() {
        ValueOperations valueOperations = redisTemplate.opsForValue();
        return (Integer) valueOperations.get(SHOP_STATUS_KEY);
    }
}
