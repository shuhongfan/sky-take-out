package com.sky.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sky.constant.MessageConstant;
import com.sky.dto.UserLoginDTO;
import com.sky.entity.User;
import com.sky.exception.LoginFailedException;
import com.sky.mapper.UserMapper;
import com.sky.properties.WeChatProperties;
import com.sky.service.UserService;
import com.sky.utils.HttpClientUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {
    //微信服务接口地址
    private static final String WX_LOGIN_URL="https://api.weixin.qq.com/sns/jscode2session";
    @Autowired
    WeChatProperties weChatProperties;
    @Autowired
    UserMapper userMapper;
    @Override
    public User wxlogin(UserLoginDTO userLoginDTO) {
        String openId = getOpenId(userLoginDTO);

        //若用户openid为空则抛出异常
        if(openId==null||openId.isEmpty()){
            throw new LoginFailedException(MessageConstant.LOGIN_FAILED);
        }

        //判断是不是新用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getOpenid, openId));
        if(user==null){
            user=User.builder().openid(openId)
                    .createTime(LocalDateTime.now())
                    .build();
            //不是需要存入数据库
            userMapper.insert(user);
        }

        return user;
    }

    private String getOpenId(UserLoginDTO userLoginDTO) {
        //调用微信登录接口获取用户openid
        Map<String,String>map=new HashMap<>();
        map.put("appid",weChatProperties.getAppid());
        map.put("secret",weChatProperties.getSecret());
        map.put("js_code", userLoginDTO.getCode());
        map.put("grant_type","authorization_code");
        String jsonRespond = HttpClientUtil.doGet(WX_LOGIN_URL, map);
        JSONObject jsonObject = JSON.parseObject(jsonRespond);
        String openId = jsonObject.getString("openid");
        return openId;
    }
}
