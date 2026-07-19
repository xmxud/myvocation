/**
 * 节点控制器
 * 处理所有节点相关的业务逻辑
 */

const { query, get, run } = require('../db/db');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * 获取节点详情
 */
async function getNode(req, res) {
  try {
    const { id } = req.params;
    const node = await get('SELECT * FROM planning_nodes WHERE id = ?', [id]);
    if (!node) {
      return errorResponse(res, new Error('节点不存在'), 404, '节点不存在');
    }
    successResponse(res, node);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取节点的子节点
 */
async function getChildren(req, res) {
  try {
    const { id } = req.params;
    const children = await query(
      'SELECT * FROM planning_nodes WHERE parent_id = ? ORDER BY sort_order ASC',
      [id]
    );
    successResponse(res, children);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 获取完整的树结构
 */
async function getFullTree(req, res) {
  try {
    const { id } = req.params;

    // 获取节点及其所有后代
    const node = await get('SELECT * FROM planning_nodes WHERE id = ?', [id]);
    if (!node) {
      return errorResponse(res, new Error('节点不存在'), 404, '节点不存在');
    }

    // 递归获取子树
    async function buildTree(parentId) {
      const children = await query(
        'SELECT * FROM planning_nodes WHERE parent_id = ? ORDER BY sort_order ASC',
        [parentId]
      );
      for (const child of children) {
        child.children = await buildTree(child.id);
      }
      return children;
    }

    node.children = await buildTree(id);
    successResponse(res, node);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 新增节点
 */
async function createNode(req, res) {
  try {
    const { node_type, title, codename, description, parent_id, priority, task_type, tag, extra_data } =
      req.body;

    if (!node_type || !title) {
      return errorResponse(res, new Error('缺少必填字段'), 400, '缺少必填字段');
    }

    const sql = `
      INSERT INTO planning_nodes 
      (node_type, title, codename, description, parent_id, priority, task_type, tag, extra_data, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const result = await run(sql, [node_type, title, codename, description, parent_id, priority, task_type, tag, extra_data]);
    const newNode = await get('SELECT * FROM planning_nodes WHERE id = ?', [result.id]);
    successResponse(res, newNode, '节点创建成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 更新节点
 */
async function updateNode(req, res) {
  try {
    const { id } = req.params;
    const { title, codename, description, is_completed, progress_percent, priority, task_type, tag, extra_data } = req.body;

    const sql = `
      UPDATE planning_nodes
      SET title = COALESCE(?, title),
          codename = COALESCE(?, codename),
          description = COALESCE(?, description),
          is_completed = COALESCE(?, is_completed),
          progress_percent = COALESCE(?, progress_percent),
          priority = COALESCE(?, priority),
          task_type = COALESCE(?, task_type),
          tag = COALESCE(?, tag),
          extra_data = COALESCE(?, extra_data),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await run(sql, [title, codename, description, is_completed, progress_percent, priority, task_type, tag, extra_data, id]);
    const updatedNode = await get('SELECT * FROM planning_nodes WHERE id = ?', [id]);
    successResponse(res, updatedNode, '节点更新成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除节点（级联删除）
 */
async function deleteNode(req, res) {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM planning_nodes WHERE id = ?', [id]);
    if (result.changes === 0) {
      return errorResponse(res, new Error('节点不存在'), 404, '节点不存在');
    }
    successResponse(res, { deletedId: id }, '节点删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 添加文字描述
 */
async function addDescription(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return errorResponse(res, new Error('描述内容不能为空'), 400, '描述内容不能为空');
    }

    const result = await run(
      'INSERT INTO node_descriptions (node_id, content, order_index) VALUES (?, ?, (SELECT COUNT(*) FROM node_descriptions WHERE node_id = ?))',
      [id, content, id]
    );

    const desc = await get('SELECT * FROM node_descriptions WHERE id = ?', [result.id]);
    successResponse(res, desc, '描述添加成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除文字描述
 */
async function deleteDescription(req, res) {
  try {
    const { id, descId } = req.params;
    await run('DELETE FROM node_descriptions WHERE id = ? AND node_id = ?', [descId, id]);
    successResponse(res, { deletedId: descId }, '描述删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 添加图片
 */
async function addImage(req, res) {
  try {
    const { id } = req.params;
    const { image_url, title, description } = req.body;

    if (!image_url) {
      return errorResponse(res, new Error('图片URL不能为空'), 400, '图片URL不能为空');
    }

    const result = await run(
      'INSERT INTO node_images (node_id, image_url, title, description, order_index) VALUES (?, ?, ?, ?, (SELECT COUNT(*) FROM node_images WHERE node_id = ?))',
      [id, image_url, title, description, id]
    );

    const image = await get('SELECT * FROM node_images WHERE id = ?', [result.id]);
    successResponse(res, image, '图片添加成功', 201);
  } catch (error) {
    errorResponse(res, error);
  }
}

/**
 * 删除图片
 */
async function deleteImage(req, res) {
  try {
    const { id, imageId } = req.params;
    await run('DELETE FROM node_images WHERE id = ? AND node_id = ?', [imageId, id]);
    successResponse(res, { deletedId: imageId }, '图片删除成功');
  } catch (error) {
    errorResponse(res, error);
  }
}

module.exports = {
  getNode,
  getChildren,
  getFullTree,
  createNode,
  updateNode,
  deleteNode,
  addDescription,
  deleteDescription,
  addImage,
  deleteImage,
};
