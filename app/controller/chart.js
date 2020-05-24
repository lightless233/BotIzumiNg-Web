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
                    data: it.value.map(numStr => parseFloat(numStr)),
                    type: 'line',
                    smooth: true,
                    label: {show: true}
                });
                legendArray.push(it.name);
                // logger.info("it.value: %j", it.value)
            })
        } catch (e) {
            response.msg = "error while parse series data"
            response.code = 500
            return
        }
        logger.info("seriesArray: %j", seriesArray)

        let xAxis = null
        const xLength = seriesArray[0].data.length
        if (data.xAxis === this.AUTO) {
            xAxis = new Array(xLength).fill('x')
        } else {
            if (xLength !== data.xAxis.split(',').length) {
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
        const opt = {
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
        };
        logger.info("opt: %j", opt)
        chart.setOption(opt)

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