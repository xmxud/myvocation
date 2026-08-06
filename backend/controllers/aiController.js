/**
 * AI 控制器
 * 对接 DeepSeek 大模型，提供智能诊断、变式题生成等功能
 */

const OpenAI = require('openai');
const { successResponse, errorResponse } = require('../utils/errorHandler');

// 初始化 DeepSeek 客户端（兼容 OpenAI SDK）
function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'sk-your-deepseek-api-key-here') {
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  });
}

/**
 * 系统 Prompt - 高三学习引擎专家
 */
const SYSTEM_PROMPT = `你是高三学习引擎的 AI 诊断专家。你的职责是：
1. 基于学生薄弱知识点，生成针对性的基础/中档变式题（不追求难题）
2. 分析错题归因，给出对症的学习建议
3. 用鼓励、务实、精炼的语言帮助学生

回答规则：
- 变式题要围绕同一知识点，难度循序渐进
- 每道题给出参考答案和简要解析
- 不做超出高三范围的拓展
- 输出使用简体中文`;

/**
 * POST /api/ai/generate-exercises
 * 基于薄弱知识点生成变式题
 *
 * Body: {
 *   subject: "数学",        // 学科
 *   knowledgePoint: "三角函数", // 知识点
 *   weakReason: "公式混淆",  // 薄弱原因
 *   count: 3               // 生成题目数量（默认3）
 * }
 */
async function generateExercises(req, res) {
  try {
    const client = getClient();
    if (!client) {
      return errorResponse(res, new Error('未配置 DeepSeek API Key'), 503, '请先配置 DEEPSEEK_API_KEY，参考 backend/.env.example');
    }

    const { subject = '数学', knowledgePoint, weakReason, count = 3 } = req.body;

    if (!knowledgePoint) {
      return errorResponse(res, new Error('缺少知识点'), 400, '请提供 knowledgePoint 参数');
    }

    const userMessage = [
      `学科：${subject}`,
      `薄弱知识点：${knowledgePoint}`,
      `薄弱原因：${weakReason || '概念不清'}`,
      `请生成 ${Math.min(count, 5)} 道针对该知识点的变式题，要求：`,
      `1. 难度：基础到中档，适合高三一轮复习`,
      `2. 每道题包含：题干、参考答案、简要解析`,
      `3. 题目之间难度递增`,
      `4. 重点帮助学生理解核心概念，而不是机械刷题`,
    ].join('\n');

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const result = completion.choices[0]?.message?.content || '';

    successResponse(res, {
      subject,
      knowledgePoint,
      weakReason,
      exercises: result,
    });
  } catch (error) {
    console.error('AI 生成变式题失败:', error);
    errorResponse(res, error, 500, `AI 调用失败: ${error.message}`);
  }
}

/**
 * POST /api/ai/analyze-mistake
 * 分析错题并给出诊断建议
 *
 * Body: {
 *   subject: "物理",
 *   question: "题目内容...",
 *   studentAnswer: "学生的错误答案/思路",
 *   correctAnswer: "正确答案",
 *   mistakeTag: "概念模糊"  // 学生自评的归因标签
 * }
 */
async function analyzeMistake(req, res) {
  try {
    const client = getClient();
    if (!client) {
      return errorResponse(res, new Error('未配置 DeepSeek API Key'), 503, '请先配置 DEEPSEEK_API_KEY，参考 backend/.env.example');
    }

    const { subject, question, studentAnswer, correctAnswer, mistakeTag } = req.body;

    if (!subject || !question) {
      return errorResponse(res, new Error('缺少必填参数'), 400, '请提供 subject 和 question');
    }

    const userMessage = [
      `学科：${subject}`,
      `原题：${question}`,
      studentAnswer ? `学生作答：${studentAnswer}` : '',
      correctAnswer ? `正确答案：${correctAnswer}` : '',
      mistakeTag ? `学生自评归因：${mistakeTag}` : '',
      '',
      `请分析：`,
      `1. 这道题考察的核心知识点是什么`,
      `2. 学生的错误根源在哪里（概念、审题、计算、规范等）`,
      `3. 给出具体改进建议（2-3条）`,
      `4. 推荐复习方向（教材章节/题型）`,
    ].filter(Boolean).join('\n');

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const result = completion.choices[0]?.message?.content || '';

    successResponse(res, {
      subject,
      analysis: result,
    });
  } catch (error) {
    console.error('AI 错题分析失败:', error);
    errorResponse(res, error, 500, `AI 调用失败: ${error.message}`);
  }
}

/**
 * GET /api/ai/health
 * 检查 AI 服务可用性
 */
async function healthCheck(req, res) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const configured = apiKey && apiKey !== 'sk-your-deepseek-api-key-here';

  successResponse(res, {
    configured,
    model: configured ? 'deepseek-chat' : null,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    hint: configured
      ? 'AI 服务已就绪'
      : '请将 backend/.env 中的 DEEPSEEK_API_KEY 替换为你的真实 Key（从 https://platform.deepseek.com/api_keys 获取）',
  });
}

module.exports = {
  generateExercises,
  analyzeMistake,
  healthCheck,
};
