'use strict';

const Controller = require('egg').Controller;

class ChartController extends Controller {
    async line() {
        const {ctx} = this;
        ctx.body = '233';
    }
}

module.exports = ChartController;