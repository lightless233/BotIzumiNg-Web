'use strict';

const Controller = require('egg').Controller;
const canvas = require("canvas");
const echarts = require("echarts");


class ChartController extends Controller {
    /*
        data={
            "data": "100,200,50,2000",
            "xAxis": "<auto>",
            "xAxis": "a,b,c,d"
        }&showImg=1
     */
    async line() {

        const {ctx} = this;
        const query = this.ctx.query;
        const response = {
            code: 0,
            msg: '',
            data: '',
        }

        const logger = ctx.logger

        let data = query.data || null
        let showImg = query.showImg || '0'
        try {
            showImg = parseInt(showImg)
        } catch (e) {
            response.code = 500
            response.msg = "showImg error."
            ctx.body = response
            return
        }

        if (data === null) {
            response.code = 500
            response.msg = 'data is null!'
            ctx.body = response
            return
        }

        // 校验data的数据
        data = JSON.parse(data)
        let seriesData = data.data.split(',').map(numStr => parseFloat(numStr))
        let finalAxis;
        logger.debug("seriesData:" + seriesData)
        if (data.xAxis === "<auto>") {
            finalAxis = new Array(seriesData.length).fill('x')
        } else {
            if (seriesData.length !== data.xAxis.split(',').length) {
                response.code = 500
                response.msg = 'xAxis.length not eq to data.length'
                ctx.body = response
                return
            }
            finalAxis = data.xAxis.split(',')
        }

        let canvasCtx = canvas.createCanvas(800, 450)
        echarts.setCanvasCreator(() => canvasCtx);
        let chart = echarts.init(canvasCtx);
        chart.setOption({
            xAxis: {
                type: 'category',
                data: finalAxis
            },
            yAxis: {
                type: 'value',
                minInterval: 1, // 保证Y轴最小间隔为1，不出现小数
            },
            series: [{
                data: seriesData,
                type: 'line',
                animation: false,
            }],
            animation: false,
            backgroundColor: 'rgb(255, 255, 255)'
        })

        // 根据 showImg 参数决定返回类型
        if (showImg === 1) {
            ctx.set('Content-type', 'image/png');
            ctx.body = chart.getDom().toBuffer();
        } else {
            response.msg = "success"
            response.code = 200
            response.data = chart.getDom().toDataURL('image/jpeg', 0.7)
            ctx.body = response
        }
    }
}

module.exports = ChartController;