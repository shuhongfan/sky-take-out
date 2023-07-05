# 瑞吉外卖

## 1 pc 端需求概述

> 随着餐饮行业竞争的加剧，传统餐饮系统间畅通程度较差，收银产品、会员产品、供应链产品等各个模块相互割裂，形成了各个信息孤岛，导致信息不对称、商家工作耗能大、增加商家人力物力和沟通成本，在三高一低的压力下，商家的竞争力不断被弱化。

#### 版本迭代

v1.2
开发人员：司文强；
迭代内容：
员工管理：加入修改时间字段，状态正常文案改为启用，增加查询按钮
分类管理：搜索条件增加名称和类型，加入状态字段，增加启用，禁用功能
菜品管理：搜索条件增加菜品分类，售卖状态，增加查询按钮，新增菜品默认为禁用状态
套餐管理：搜索条件增加套餐分类，售卖状态，增加查询按钮，新增菜品默认为套餐状态
其他：根据设计稿调整了页面的部分样式以及交互，修复了这 4 个模块其余的 bug 和问题
v1.3
开发人员：司文强；
迭代内容：
订单管理：
新增订单状态切换 tab
新增列表字段和操作按钮（派送，接单，拒单）
新增订单详情
新增订单语音播报

##### 门店管理

- 门店登录
- 门店概况
- 员工管理
- 分类管理
- 菜品管理

## 资源

- git http://git.itcast.cn/itcast_huangxu/project-rjwm-pc-vue-java.git
- 预览 暂无

## 2 技术选型

### 2.1 技术选型分析

- 技术上选用目前市场上流行的 Vue 结合 TypeScript（也是目前前端市场比较火热的计算）
- 开发相关技术包含 element-ui + vue-router + sass + axios 等 详细参考 package.json 文件

### 2.2 vue 简介

> Vue 是一套用于构建用户界面的渐进式框架。 目前是前端较为火热的三大框架之一(Angular<国外用的较多>、React、Vue)
> 简单快捷易于上手、学习成本低的特点得到迅速的推广、目前为基本是前端的必修技术。无论是找工作还是学校都是上佳的选择

- vue.js 优点:更轻量,单页面,简单易学 缺点:不支持 IE8 及以下版本
- react 优点:速度快、跨浏览器兼容、单向数据流、兼容性好 缺点:并不是一个完整的框架,需要加上 ReactRouter 和 Flux 才能完成。主要是学校成本较高
- Angular 优点:模块化功能强大、自定义 directive 非常灵活、双向数据绑定,依赖注入 缺点:比较笨重,学习成本高,不兼容 IE6/7

## 3 工程结构解析

```
├── public                     # 静态资源 (会被直接复制)
│   │── favicon.ico            # favicon图标
│   │── manifest.json          # PWA 配置文件
│   │── img                    # 静态图片存放
│   └── index.html             # html模板
├── src                        # 源代码
│   ├── api                    # 所有请求
│   ├── assets                 # 主题 字体等静态资源 (由 webpack 处理加载)
│   ├── components             # 全局组件
│   ├── icons                  # svg 图标
│   ├── layout                 # 全局布局
│   ├── router                 # 路由
│   ├── store                  # 全局 vuex store
│   ├── styles                 # 全局样式
│   ├── utils                  # 全局方法
│   ├── views                  # 所有页面
│       ├── category           # 分类管理
│       ├── employee           # 员工管理
│       ├── dish               # 菜品管理、添加菜品
│       ├── login              # 登录
│       ├── package            # 套餐管理、添加套餐
│       ├── orders             # 订单
│       ├── orderDetail        # 订单明细
│       ├── chart              # 表单
│       └── 404.vue            # 404报错页面
│   ├── App.vue                # 入口页面
│   ├── main.js                # 入口文件 加载组件 初始化等
│   ├── permission.ts          # 权限管理
│   └── shims-vue.d.ts         # 模块注入
├── dist                       # 打包文件夹（可删除重新打包）
├── tests                      # 测试
├── .circleci/                 # 自动化 CI 配置
├── .browserslistrc            # browserslistrc 配置文件 (用于支持 Autoprefixer)
├── .editorconfig              # 编辑相关配置
├── .env.xxx                   # 环境变量配置
├── .eslintrc.js               # eslint 配置
├── babel.config.js            # babel-loader 配置
├── cypress.json               # e2e 测试配置
├── jest.config.js             # jest 单元测试配置
├── package.json               # package.json 依赖
├── postcss.config.js          # postcss 配置
├── tsconfig.json              # typescript 配置
└── vue.config.js              # vue-cli 配置

```

### 文档参考

- vue[https://cn.vuejs.org/v2/guide/]

## 4 部署运行指南

#### 图片预览地址服务器部署需要修改 baseUrl src/config.json

# 例如

```
{
  "baseUrl": "http://172.17.0.60:8200" 此地址修改为服务器部署地址
}
```

##### 安装依赖

```bash
yarn install/npm install
```

##### 启动本地开发环境（自带热启动）

```bash
yarn serve/npm run serve
```

##### 压缩打包 <打包生成文件为 dist 文件夹>

##### 线上 去掉删除功能

```bash
yarn build/npm run build
```

##### 测试 保留删除功能

```bash
yarn build:uat/npm run build:uat
```

## 5 相关资料

前端
瑞吉外卖 - 后台：
git 分支 ：http://git.itcast.cn/development/project-rjwm-admin-vue-ts/tree/master

pip 分支 1.0 的上线版本（22.4 修复套餐管理 Bug） 前端负责人： 李小刚

master 分支 2.0 的教学版本（大改） - 前端负责人： 司文强

瑞吉外卖 - 微信小程序：
git 分支：http://git.itcast.cn/development/project-rjwm-weixin-uniapp

master（pip 线上版本，22.4 修复总金额计算问题）：pip 线上版本 前端负责人： 娄江华

pudateV2.0： 前端负责人： 娄江华

接口 ：Yapi
后台 V2.0: https://mock.boxuegu.com/project/3059/interface/api

小程序 V2.0 https://mock.boxuegu.com/project/3109/interface/api

部署： 运维 ：任昶丞
pip: http://rjwm-java.itheima.net

master: (22.4 测试环境) http://rjwm-java-test.itheima.net/

后端：赵庆轩、张家乐
git：（对应 master 分支的-最新的代码）http://git.itcast.cn/java/reggie_parent

产品： 魏帅明
管理后台

原型地址：https://codesign.qq.com/s/zm5q0XPXed0RBb6/preview/prototype/nRMdGZQOpa9Xk8x

密码: K0RR

小程序端

原型地址：https://codesign.qq.com/s/OD8r0BreVr0RXkg/P4VlZMeeylRZq6w/inspect

设计：
管理后台端 - 王静

https://codesign.qq.com/s/zm5q0XPXed0RBb6

小程序 - 惠转转

https://codesign.qq.com/s/OD8r0BreVr0RXkg
