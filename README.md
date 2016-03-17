# 介绍
解析raml的api生成nodejs的服务端

# 使用说明
1、安装`npm install --save https://github.com/hualuomoli/raml-parser-nodejs.git`<br>
2、编写测试文件`app.js`<br>
`    var creator = require('raml-parser-nodejs');`<br>
`    creator.create(raml文件路径);`<br>

3、执行命令`node app.js` 生成raml的服务端<br>
4、启动raml服务端<br>
`    cd output`<br>
`    npm install`<br>
`    node app.js`<br>


