package com.sky.controller.user;

import com.sky.result.Result;
import com.sky.service.ShopService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("userShopController")
@RequestMapping("/user/shop")
@Api(tags = "店铺相关接口")
@Slf4j
public class ShopController {


    @Autowired
    ShopService shopService;



    @GetMapping("/status")
    @ApiOperation("获取店铺营业状态")
    public Result getStatus( ){
        int status=shopService.getStatus();
        log.info("获取店铺营业状态为:{}",status==1? "营业中":"打烊中");
        return Result.success(status);
    }
}
