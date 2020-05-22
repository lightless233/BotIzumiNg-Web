'use strict';

const Controller = require('egg').Controller;
const canvas = require("canvas");
const echarts = require("echarts");


class ChartController extends Controller {

    AUTO = "<auto>"

    getShowImg(query) {
        let value = query.showImg || '0'
        try {
            return parseInt(value)
        } catch (e) {
            return null
        }
    }

    /*
        data={
            "data": "100,200,50,2000",
            "xAxis": "<auto>" or "a,b,c,d"
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
                smooth: true,
                label: {show: true}
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
            response.data = chart.getDom().toDataURL('image/jpeg')
            ctx.body = response
        }
    }

    /*
        data = {
            "data": [
                {
                    "name": "",
                    "value": [100, 20, 50]
                },
                {
                    "name": "",
                    "value": [200, 500, 50],
                },
                {
                    "name": "",
                    "value": [400, 50, 50],
                },
            ],
            "xAxis": "<auto>" or "a,b,c,d",
            "title": "Awesome Title"
        }&showImg=1
     */
    async multiLine() {
        const {ctx} = this;
        const query = ctx.query;
        const response = {
            code: 0,
            msg: '',
            data: '',
        }
        const logger = ctx.logger

        let data = query.data || null;
        const showImg = this.getShowImg(query)
        logger.info("query: " + query)
        if (showImg === null || data === null) {
            response.code = 500
            response.msg = 'showImg or data error.'
            ctx.body = response
            return
        }

        // data 相关的校验
        data = JSON.parse(data)
        let rawSeriesData = data.data   // Array
        let seriesArray = []
        let legendArray = []

        try {
            rawSeriesData.forEach(it => {
                seriesArray.push({
                    name: it.name,
                    data: it.value.map(it => {
                        parseFloat(it)
                    }),    // TODO here
                    type: 'line',
                    smooth: true,
                    label: {show: true}
                });
                legendArray.push(it.name);
            })
        } catch (e) {
            response.msg = "error while parse series data"
            response.code = 500
            return
        }
        logger.info("seriesArray: %j", seriesArray)

        let xAxis = null
        if (data.xAxis === this.AUTO) {
            xAxis = new Array(seriesArray.length).fill('x')
        } else {
            if (seriesArray.length !== data.xAxis.split(',').length) {
                response.code = 500
                response.msg = 'xAxis.length not eq to data.length'
                ctx.body = response
                return
            }
            xAxis = data.xAxis.split(',').map(it => {
                if (it.trim() === "") {
                    return null
                } else {
                    return it.trim()
                }
            }).filter(it => it !== null)
        }

        // title
        const title = data.title || "无标题"

        let canvasCtx = canvas.createCanvas(800, 450)
        echarts.setCanvasCreator(() => canvasCtx);
        let chart = echarts.init(canvasCtx);
        chart.setOption({
            title: {
                text: title
            },
            xAxis: {
                type: 'category',
                data: xAxis
            },
            yAxis: {
                type: 'value',
                minInterval: 1
            },
            series: seriesArray,
            animation: false,
            backgroundColor: 'rgb(255, 255, 255)',
            legend: {
                data: legendArray
            },
        });

        if (showImg === 1) {
            ctx.set('Content-Type', 'image/png');
            ctx.body = chart.getDom().toBuffer();
        } else {
            response.msg = 'success';
            response.code = 200
            response.data = chart.getDom().toDataURL('image/jpeg');
            ctx.body = response
        }

    }
}

module.exports = ChartController;