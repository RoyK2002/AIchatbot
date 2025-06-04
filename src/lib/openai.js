"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatResponse = void 0;
var openai_1 = require("openai");
var validateApiKey = function (apiKey) {
    // Basic validation: must start with 'sk-' and be reasonably long
    return apiKey.startsWith('sk-') && apiKey.length > 20;
};
var getOpenAIClient = function () {
    var apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
    }
    if (!validateApiKey(apiKey)) {
        throw new Error('Invalid OpenAI API key format. API keys should start with "sk-". Please check your API key at https://platform.openai.com/account/api-keys');
    }
    return new openai_1.default({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
};
// Rate limiting configuration
var RATE_LIMIT = 10; // messages per minute
var MESSAGE_HISTORY = [];
var isRateLimited = function () {
    var now = Date.now();
    var oneMinuteAgo = now - 60 * 1000;
    // Remove messages older than 1 minute
    while (MESSAGE_HISTORY.length > 0 && MESSAGE_HISTORY[0] < oneMinuteAgo) {
        MESSAGE_HISTORY.shift();
    }
    return MESSAGE_HISTORY.length >= RATE_LIMIT;
};
var getChatResponse = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var SYSTEM_PROMPT, openai, sendRequest, error_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (isRateLimited()) {
                    throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
                }
                SYSTEM_PROMPT = "You are Winston, a friendly and professional AI assistant at DigitalStaff. Help users with automation-related questions and invite them to schedule a call at https://calendly.com/digitalstaff/call-with-oscar/ if needed.";
                openai = getOpenAIClient();
                MESSAGE_HISTORY.push(Date.now());
                sendRequest = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var completion;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, openai.chat.completions.create({
                                    messages: [
                                        { role: 'system', content: SYSTEM_PROMPT },
                                        { role: 'user', content: message }
                                    ],
                                    model: 'gpt-3.5-turbo',
                                })];
                            case 1:
                                completion = _c.sent();
                                if (!((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content)) {
                                    throw new Error('Received an empty response from OpenAI');
                                }
                                return [2 /*return*/, completion.choices[0].message.content];
                        }
                    });
                }); };
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 9]);
                return [4 /*yield*/, sendRequest()];
            case 2: return [2 /*return*/, _b.sent()];
            case 3:
                error_1 = _b.sent();
                if (!error_1.message.includes('429')) return [3 /*break*/, 8];
                console.warn('Rate limit hit. Retrying in 5 seconds...');
                return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, 5000); })];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, sendRequest()];
            case 6: return [2 /*return*/, _b.sent()];
            case 7:
                _a = _b.sent();
                throw new Error('Too many requests. Please wait a moment before trying again.');
            case 8:
                if (error_1.message.includes('401')) {
                    throw new Error('Invalid API key. Please check your OpenAI API key.');
                }
                if (error_1.message.includes('503')) {
                    throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
                }
                if (error_1 instanceof Error) {
                    console.error('OpenAI API Error:', {
                        name: error_1.name,
                        message: error_1.message,
                        cause: error_1.cause,
                        stack: error_1.stack,
                    });
                    throw error_1;
                }
                throw new Error('Sorry, I encountered an error while processing your message. Please try again.');
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getChatResponse = getChatResponse;
