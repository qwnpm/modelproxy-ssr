import { IEngine } from "../models/engine";
import { IInterfaceModel, IInterfaceModelCommon } from "../models/interface";
import { MethodType } from "../models/method";
import { BaseFactory } from "./base.factory";
import { engineFactory } from "./engine.factory";
import { IExecute } from "../models/execute";

export class InterfaceFactory extends BaseFactory<IInterfaceModel> {
    constructor() { super(); }

    /**
    * 添加一个实例
    * @param   {string}  name        实例的名称
    * @param   {IEngine} engine      实例
    * @param   {boolean} override    是否覆盖
    * @returns {void}
    */
    public add(name: string, instance: IInterfaceModel, override = false): void {
        super.add(name, instance, override);

        Object.assign(instance, {
            delete: this.custom.bind(this, instance, "DELETE"),
            execute: this.execute.bind(this, instance),
            get: this.custom.bind(this, instance, "GET"),
            getFullPath: this.getFullPath.bind(this, instance),
            getPath: this.getPath.bind(this, instance),
            post: this.custom.bind(this, instance, "POST", null),
            put: this.custom.bind(this, instance, "PUT"),
            // patch: this.custom.bind(this, instance, "GET"),
        });
    }
    /**
     * 执行函数
     * @param   {IInterfaceModel} intance  接口的具体实例
     * @param   {IExeucte}        options  调用接口所需的data
     * @returns {Promise<any>}
     */
    public async execute(instance: IInterfaceModel, options: IExecute): Promise<any> {
        let engine: IEngine;
        let iinstance: IInterfaceModel;
        let { instance: extraInstance = {} } = options;

        iinstance = this.megreInstance(instance, extraInstance);
        engine = engineFactory.use(iinstance.engine as string);

        try {
            // 验证数据的准确性
            await engine.validate(iinstance, options);
        } catch (e) {
            throw e;
        }

        return engine.proxy(iinstance, options);
    }

    /**
     * 处理请求
     * @param   {IInterfaceModel}        instance 接口的具体实例
     * @param   {string}                 type     请求类型
     * @param   {string | number | null} id       id
     * @param   {IExecute}               options  请求参数
     * @returns {Promise<any>}
     */
    public async custom(instance: IInterfaceModel, type: string, id?: string | number | null, options: IExecute = {}) {
        let { instance: extraInstance = {}, params = {} } = options;

        extraInstance.method = type;
        if (id) {
            extraInstance.path = instance.path + "/:id";
            params.id = id;
        }

        options.instance = extraInstance;
        options.params = params;

        return await this.execute(instance, options);
    }
    /**
    * 合并两个实例
    * @param   {IInterfaceModel}       instance       实例名称
    * @param   {IInterfaceModelCommon} extendInstance 需要合并的实例
    * @returns {IInterfaceModel}
    */
    private megreInstance(instance: IInterfaceModel, extendInstance: IInterfaceModelCommon = {}): IInterfaceModel {
        return Object.assign({}, instance, extendInstance);
    }
    /**
     * 获取接口的路径
     * @param  {IInterfaceModel}       instance       实例名称
     * @param  {IInterfaceModelCommon} extendInstance 需要合并的实例
     * @returns {string}
     */
    private getPath(instance: IInterfaceModel, extendInstance: IInterfaceModelCommon = {}): string {
        let engine: IEngine;
        let iinstance: IInterfaceModel;

        iinstance = this.megreInstance(instance, extendInstance);

        engine = engineFactory.use("default");

        return engine.getStatePath(iinstance) + iinstance.path;
    }
    /**
     * 获取接口的路径
     * @param   {IInterfaceModel} instance       实例名称
     * @param   {IExecute}        extendInstance 需要合并的实例
     * @returns {string}
     */
    private getFullPath(instance: IInterfaceModel, options: IExecute = {}): string {
        let engine: IEngine;
        let iinstance: IInterfaceModel;

        iinstance = this.megreInstance(instance, options.instance);

        engine = engineFactory.use("default");

        return engine.getFullPath(iinstance, options);
    }
}
