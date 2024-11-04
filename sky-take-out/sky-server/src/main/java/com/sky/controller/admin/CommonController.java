package com.sky.controller.admin;

import com.sky.constant.MessageConstant;
import com.sky.result.Result;
import com.sky.utils.AliOssUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.util.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@RestController
@RequestMapping("/admin/common")
@Api(tags = "通用接口")
@Slf4j
public class CommonController {
    @Autowired
    AliOssUtil aliOssUtil;

    @PostMapping("/upload")
    @ApiOperation("文件上传")
    public Result upload(MultipartFile file){
        log.info("文件为: " + file);
        try {
            //课程提供的阿里云不可用
            //todo:这里暂时采用本地存储，后续优化为minio
//            String fileOriginalFilename = file.getOriginalFilename();
//            String extension = fileOriginalFilename.substring(fileOriginalFilename.lastIndexOf("."));
//            String fileName = UUID.randomUUID() + extension;
//            String filePath = aliOssUtil.upload(file.getBytes(), fileName);
            String fileOriginalFilename = file.getOriginalFilename();
            String extension = fileOriginalFilename.substring(fileOriginalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID() + extension;
            InputStream inputStream = file.getInputStream();
            String filePath="E:\\Develop\\java项目\\cangqio\\后端初始工程\\sky-take-out\\sky-server\\src\\main\\java\\com\\sky\\img\\"+fileName;
            FileOutputStream outputStream=new FileOutputStream(filePath);
            IOUtils.copy(inputStream,outputStream);
            return Result.success(filePath);
        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage());
        }
        return Result.error(MessageConstant.UPLOAD_FAILED);
    }
}
