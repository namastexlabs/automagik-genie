/// <reference types="node" />
import { AggregatedResult } from '@jest/test-result';
export declare const tempDirPath: string;
export declare const dataDirPath: string;
export declare const attachDirPath: string;
export declare const resourceDirName = "./jest-html-reporters-attach";
interface IAddAttachParams {
    attach: string | Buffer;
    description: string | object;
    context?: any;
    bufferFormat?: string;
}
export declare const addAttach: ({ attach, description: descriptionRaw, context, bufferFormat, }: IAddAttachParams) => Promise<void>;
interface IAddMsgParams {
    message: string | object;
    context?: any;
}
/**
 *
 * @param {string} message
 * @param {object} context. Optional. It contains custom configs
 */
export declare const addMsg: ({ message, context }: IAddMsgParams) => Promise<void>;
export declare const readAttachInfos: (publicPath: string, publicRelativePath: string) => Promise<any>;
export declare const getOptions: (reporterOptions?: {}) => {
    publicPath: string;
    filename: string;
    expand: boolean;
    pageTitle: string;
    logoImgPath: any;
    hideIcon: boolean;
    customInfos: any;
    testCommand: string;
    openReport: boolean;
    failureMessageOnly: number;
    enableMergeData: boolean;
    dataMergeLevel: number;
    inlineSource: boolean;
    urlForTestFiles: string;
    darkTheme: boolean;
    includeConsoleLog: boolean;
    stripSkippedTest: boolean;
};
export declare const copyAndReplace: ({ tmpPath, outPutPath, pattern, newSubstr, }: {
    tmpPath: string;
    outPutPath: string;
    pattern: string | RegExp;
    newSubstr: string;
}) => void;
export declare const replaceRootDirVariable: (publicPath: string, rootDirPath: string) => string;
export declare const deepClone: <T>(obj: T) => T;
export declare const filterSkipTests: (obj: AggregatedResult) => AggregatedResult;
export {};
