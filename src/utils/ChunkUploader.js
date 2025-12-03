import {
  initChunkUpload,
  uploadChunk,
  completeChunkUpload,
  getChunkUploadStatus,
  cancelChunkUpload
} from '../services/createApp';

/**
 * 分片上传工具类
 * 支持断点续传、并发上传、进度追踪
 */
class ChunkUploader {
  constructor(file, eventID, options = {}) {
    this.file = file;
    this.eventID = eventID;
    this.uploadUrl = options.uploadUrl || ''; // 上传 URL
    this.sessionID = null;
    this.chunkSize = options.chunkSize || 5 * 1024 * 1024; // 默认5MB
    this.concurrency = options.concurrency || 5; // 默认5个并发
    this.uploadedChunks = [];
    this.totalChunks = 0;
    this.onProgress = null;
    this.isUploading = false;
    this.isPaused = false;
    this.uploadPromises = [];
  }

  /**
   * 开始上传
   * @param {Function} onProgress - 进度回调函数 (progress) => {}
   * @returns {Promise<string>} 返回文件路径
   */
  async upload(onProgress) {
    this.onProgress = onProgress;
    this.isUploading = true;
    this.isPaused = false;

    try {
      // 1. 初始化上传会话
      await this.initSession();

      // 2. 上传所有分片
      await this.uploadAllChunks();

      // 3. 完成上传
      const filePath = await this.complete();

      this.isUploading = false;
      return filePath;
    } catch (error) {
      this.isUploading = false;
      throw error;
    }
  }

  /**
   * 断点续传
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<string>} 返回文件路径
   */
  async resume(onProgress) {
    this.onProgress = onProgress;
    this.isUploading = true;
    this.isPaused = false;

    try {
      // 查询上传状态，获取已上传的分片
      if (this.sessionID) {
        const res = await getChunkUploadStatus({
          event_id: this.eventID,
          upload_url: this.uploadUrl,
          session_id: this.sessionID
        });

        if (res && res.bean && res.bean.data) {
          this.uploadedChunks = res.bean.data.uploaded_chunks || [];
          this.totalChunks = res.bean.data.total_chunks || 0;

          // 更新进度
          if (this.onProgress) {
            const progress = (this.uploadedChunks.length / this.totalChunks) * 100;
            this.onProgress(progress);
          }
        }
      }

      // 继续上传剩余分片
      await this.uploadAllChunks();

      // 完成上传
      const filePath = await this.complete();

      this.isUploading = false;
      return filePath;
    } catch (error) {
      this.isUploading = false;
      throw error;
    }
  }

  /**
   * 暂停上传
   */
  pause() {
    this.isPaused = true;
    this.isUploading = false;
  }

  /**
   * 取消上传
   */
  async cancel() {
    this.isPaused = true;
    this.isUploading = false;

    if (this.sessionID) {
      try {
        await cancelChunkUpload({
          event_id: this.eventID,
          upload_url: this.uploadUrl,
          session_id: this.sessionID
        });
      } catch (error) {
        console.error('取消上传失败:', error);
      }
    }
  }

  /**
   * 初始化上传会话
   */
  async initSession() {    
    const res = await initChunkUpload({
      event_id: this.eventID,
      upload_url: this.uploadUrl,
      file_name: this.file.name,
      file_size: this.file.size,
      chunk_size: this.chunkSize
    });

    if (res && res.bean && res.bean.data) {
      const data = res.bean.data;
      this.sessionID = data.session_id;
      this.totalChunks = data.total_chunks;
      this.uploadedChunks = data.uploaded_chunks || [];
      this.chunkSize = data.chunk_size;

      // 如果已有上传进度，更新进度条
      if (this.onProgress && this.uploadedChunks.length > 0) {
        const progress = (this.uploadedChunks.length / this.totalChunks) * 100;
        this.onProgress(progress);
      }
    } else {
      throw new Error('初始化上传会话失败');
    }
  }

  /**
   * 上传所有分片
   */
  async uploadAllChunks() {
    // 获取需要上传的分片索引
    const chunksToUpload = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.uploadedChunks.includes(i)) {
        chunksToUpload.push(i);
      }
    }

    // 使用并发控制上传
    await this.uploadChunksWithConcurrency(chunksToUpload);
  }

  /**
   * 使用并发控制上传分片
   */
  async uploadChunksWithConcurrency(chunkIndexes) {
    const queue = [...chunkIndexes];
    const executing = [];

    while (queue.length > 0 || executing.length > 0) {
      // 检查是否暂停
      if (this.isPaused) {
        break;
      }

      // 控制并发数
      while (executing.length < this.concurrency && queue.length > 0) {
        const chunkIndex = queue.shift();
        const promise = this.uploadSingleChunk(chunkIndex)
          .then(() => {
            // 从执行队列中移除
            const index = executing.indexOf(promise);
            if (index > -1) {
              executing.splice(index, 1);
            }
          })
          .catch(error => {
            console.error(`分片 ${chunkIndex} 上传失败:`, error);
            // 上传失败，重新加入队列
            queue.push(chunkIndex);
            // 从执行队列中移除
            const index = executing.indexOf(promise);
            if (index > -1) {
              executing.splice(index, 1);
            }
          });

        executing.push(promise);
      }

      // 等待至少一个任务完成
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }
  }

  /**
   * 上传单个分片
   */
  async uploadSingleChunk(chunkIndex) {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);

    const res = await uploadChunk({
      event_id: this.eventID,
      upload_url: this.uploadUrl,
      session_id: this.sessionID,
      chunk_index: chunkIndex,
      file: chunk
    });

    if (res && res.bean && res.bean.data) {
      // 更新已上传分片列表
      if (!this.uploadedChunks.includes(chunkIndex)) {
        this.uploadedChunks.push(chunkIndex);
      }

      // 更新进度
      if (this.onProgress) {
        const progress = (this.uploadedChunks.length / this.totalChunks) * 100;
        this.onProgress(progress);
      }
    } else {
      throw new Error(`分片 ${chunkIndex} 上传失败`);
    }
  }

  /**
   * 完成上传
   */
  async complete() {
    const res = await completeChunkUpload({
      event_id: this.eventID,
      upload_url: this.uploadUrl,
      session_id: this.sessionID
    });

    if (res && res.bean && res.bean.data) {
      return res.bean.data.file_path;
    } else {
      throw new Error('完成上传失败');
    }
  }

  /**
   * 获取当前上传状态
   */
  async getStatus() {
    if (!this.sessionID) {
      return null;
    }

    const res = await getChunkUploadStatus({
      event_id: this.eventID,
      upload_url: this.uploadUrl,
      session_id: this.sessionID
    });

    if (res && res.bean && res.bean.data) {
      return res.bean.data;
    }

    return null;
  }
}

export default ChunkUploader;
