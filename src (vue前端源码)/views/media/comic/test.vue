<template>
  <div class="folder-upload-container">
    <!-- 文件夹选择区域 -->
    <div 
      class="drop-area"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      :class="{ 'dragging': isDragging }"
    >
      <input 
        type="file" 
        class="file-input" 
        ref="fileInput" 
        @change="handleFolderSelect"
        webkitdirectory 
        directory
        @click="resetInput"
      >
      
      <div class="drop-area-content">
        <i class="fas fa-folder-open upload-icon"></i>
        <h3 class="upload-title">拖拽文件夹到这里上传</h3>
        <p class="upload-subtitle">或者</p>
        <button class="browse-btn" @click="triggerFileInput">选择文件夹</button>
        <p class="folder-info">选择后将上传文件夹内所有文件（包括子文件夹）</p>
      </div>
    </div>
    
    <!-- 上传文件列表 -->
    <div class="file-list" v-if="files.length > 0">
      <h4 class="file-list-title">
        {{ currentFolderName || '已选择文件' }} ({{ files.length }})
        <span class="subfolders-count" v-if="subfoldersCount > 0">
          包含 {{ subfoldersCount }} 个子文件夹
        </span>
      </h4>
      
      <div class="file-item" v-for="(file, index) in files" :key="index">
        <div class="file-info">
          <i class="fas" :class="file.isDirectory ? 'fa-folder folder-icon' : 'fa-file file-icon'"></i>
          <div class="file-details">
            <p class="file-name">{{ file.relativePath }}</p>
            <p class="file-size" v-if="!file.isDirectory">
              {{ formatFileSize(file.size) }}
            </p>
          </div>
        </div>
        
        <div class="file-actions">
          <div class="progress-bar" v-if="file.progress !== undefined && !file.isDirectory">
            <div 
              class="progress" 
              :style="{ width: `${file.progress}%` }"
              :class="{ 
                'success': file.progress === 100 && !file.error,
                'error': file.error
              }"
            ></div>
          </div>
          
          <span class="status-icon" v-if="file.progress === 100 && !file.isDirectory">
            <i class="fas fa-check" v-if="!file.error"></i>
            <i class="fas fa-times" v-if="file.error"></i>
          </span>
          
          <button 
            class="remove-btn" 
            @click="removeFile(index)"
            :disabled="isUploading"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="upload-controls">
        <button 
          class="cancel-btn" 
          @click="clearFiles"
          :disabled="isUploading"
        >
          清空列表
        </button>
        
        <button 
          class="upload-btn" 
          @click="uploadFiles"
          :disabled="isUploading || files.length === 0 || hasNoFilesToUpload"
        >
          <i class="fas fa-upload"></i>
          {{ isUploading ? '正在上传...' : '开始上传' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 引用
const fileInput = ref(null);

// 状态管理
const files = ref([]);
const isDragging = ref(false);
const isUploading = ref(false);
const currentFolderName = ref('');
const subfoldersCount = ref(0);

// 重置输入框，允许重复选择同一文件夹
const resetInput = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 处理拖拽进入事件
const handleDragEnter = () => {
  isDragging.value = true;
};

// 处理拖拽悬停事件
const handleDragOver = () => {
  isDragging.value = true;
};

// 处理拖拽离开事件
const handleDragLeave = (e) => {
  if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false;
  }
};

// 处理文件夹放下事件
const handleDrop = (e) => {
  isDragging.value = false;
  
  // 检查是否是文件夹
  if (e.dataTransfer.items) {
    const items = Array.from(e.dataTransfer.items);
    const hasDirectories = items.some(item => item.kind === 'file' && item.webkitGetAsEntry().isDirectory);
    
    if (hasDirectories) {
      // 处理文件夹
      processDraggedItems(items);
    } else {
      alert('请拖拽文件夹而不是单个文件');
    }
  }
};

// 处理拖拽的项目
const processDraggedItems = (items) => {
  files.value = [];
  subfoldersCount.value = 0;
  
  items.forEach(item => {
    const entry = item.webkitGetAsEntry();
    if (entry && entry.isDirectory) {
      currentFolderName.value = entry.name;
      traverseDirectory(entry, entry.name);
    }
  });
};

// 遍历目录及其子目录
const traverseDirectory = (directoryEntry, path) => {
  const reader = directoryEntry.createReader();
  
  reader.readEntries((entries) => {
    entries.forEach(entry => {
      const entryPath = `${path}/${entry.name}`;
      
      if (entry.isDirectory) {
        // 记录子文件夹
        subfoldersCount.value++;
        // 添加文件夹到列表（仅作展示用）
        files.value.push({
          name: entry.name,
          relativePath: entryPath,
          isDirectory: true
        });
        // 递归遍历子目录
        traverseDirectory(entry, entryPath);
      } else if (entry.isFile) {
        // 处理文件
        entry.file(file => {
          files.value.push({
            name: entry.name,
            file: file,
            size: file.size,
            relativePath: entryPath,
            isDirectory: false,
            progress: 0,
            error: false
          });
        });
      }
    });
  });
};

// 触发文件夹选择对话框
const triggerFileInput = () => {
  resetInput();
  fileInput.value.click();
};

// 处理文件夹选择事件
const handleFolderSelect = (e) => {
  const selectedFiles = e.target.files;
  
  if (selectedFiles.length) {
    processSelectedFolder(selectedFiles);
  }
};

// 处理选择的文件夹
const processSelectedFolder = (fileList) => {
  files.value = [];
  subfoldersCount.value = 0;
  
  // 获取根文件夹名称
  const firstFile = fileList[0];
  const pathParts = firstFile.webkitRelativePath.split('/');
  currentFolderName.value = pathParts[0];
  
  // 统计子文件夹数量
  const folders = new Set();
  Array.from(fileList).forEach(file => {
    const parts = file.webkitRelativePath.split('/');
    if (parts.length > 2) {
      // 提取子文件夹路径
      for (let i = 1; i < parts.length - 1; i++) {
        folders.add(parts.slice(0, i + 1).join('/'));
      }
    }
  });
  subfoldersCount.value = folders.size;
  
  // 添加所有文件和文件夹到列表
  // 先添加文件夹
  Array.from(folders).forEach(folderPath => {
    files.value.push({
      name: folderPath.split('/').pop(),
      relativePath: folderPath,
      isDirectory: true
    });
  });
  
  // 再添加文件
  Array.from(fileList).forEach(file => {
    files.value.push({
      name: file.name,
      file: file,
      size: file.size,
      relativePath: file.webkitRelativePath,
      isDirectory: false,
      progress: 0,
      error: false
    });
  });
  
  // 按路径排序
  files.value.sort((a, b) => {
    // 文件夹排在文件前面
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    // 按路径排序
    return a.relativePath.localeCompare(b.relativePath);
  });
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 移除文件
const removeFile = (index) => {
  files.value.splice(index, 1);
};

// 清空文件列表
const clearFiles = () => {
  files.value = [];
  currentFolderName.value = '';
  subfoldersCount.value = 0;
};

// 检查是否有可上传的文件（非文件夹）
const hasNoFilesToUpload = computed(() => {
  return files.value.every(file => file.isDirectory);
});

// 上传文件
const uploadFiles = () => {
  isUploading.value = true;
  
  // 获取所有非文件夹文件
  const filesToUpload = files.value.filter(file => !file.isDirectory);
  
  // 模拟上传过程，实际项目中替换为真实API调用
  filesToUpload.forEach((file, index) => {
    file.progress = 0;
    file.error = false;
    
    const interval = setInterval(() => {
      // 随机增加进度
      const increment = Math.floor(Math.random() * 10) + 1;
      file.progress = Math.min(file.progress + increment, 100);
      
      // 随机失败模拟（10%概率）
      if (file.progress > 50 && Math.random() < 0.1) {
        file.error = true;
        clearInterval(interval);
      }
      
      // 上传完成
      if (file.progress === 100) {
        clearInterval(interval);
        
        // 检查是否所有文件都已上传
        const allCompleted = filesToUpload.every(f => f.progress === 100 || f.error);
        if (allCompleted) {
          isUploading.value = false;
        }
      }
    }, 200);
  });
};
</script>

<style lang="less" scoped>
.folder-upload-container {
  max-width: 800px;
  // margin: 20px auto;
  padding: 0 20px;
}

.drop-area {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  
  &.dragging {
    border-color: #2196f3;
    background-color: rgba(33, 150, 243, 0.1);
  }
  
  .file-input {
    display: none;
  }
  
  .drop-area-content {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .upload-icon {
    font-size: 48px;
    color: #2196f3;
    margin-bottom: 20px;
  }
  
  .upload-title {
    font-size: 24px;
    margin-bottom: 10px;
    color: #333;
  }
  
  .upload-subtitle {
    color: #666;
    margin: 15px 0;
  }
  
  .browse-btn {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
    
    &:hover {
      background-color: #0b7dda;
    }
  }
  
  .folder-info {
    margin-top: 20px;
    color: #777;
    font-size: 14px;
  }
}

.file-list {
  margin-top: 30px;
  
  .file-list-title {
    font-size: 18px;
    margin-bottom: 15px;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    
    .subfolders-count {
      font-size: 14px;
      font-weight: normal;
      color: #666;
      margin-left: 10px;
    }
  }
  
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-radius: 5px;
    background-color: #f9f9f9;
    margin-bottom: 10px;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
      
      .file-icon, .folder-icon {
        font-size: 20px;
        margin-right: 15px;
      }
      
      .file-icon {
        color: #666;
      }
      
      .folder-icon {
        color: #ffc107;
      }
      
      .file-details {
        .file-name {
          font-weight: 500;
          margin: 0 0 5px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400px;
        }
        
        .file-size {
          font-size: 12px;
          color: #777;
          margin: 0;
        }
      }
    }
    
    .file-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .progress-bar {
        width: 150px;
        height: 8px;
        background-color: #eee;
        border-radius: 4px;
        overflow: hidden;
        
        .progress {
          height: 100%;
          background-color: #2196f3;
          transition: width 0.3s ease;
          
          &.success {
            background-color: #28a745;
          }
          
          &.error {
            background-color: #dc3545;
          }
        }
      }
      
      .status-icon {
        font-size: 18px;
        
        .fa-check {
          color: #28a745;
        }
        
        .fa-times {
          color: #dc3545;
        }
      }
      
      .remove-btn {
        background: none;
        border: none;
        color: #777;
        cursor: pointer;
        font-size: 16px;
        transition: color 0.2s ease;
        
        &:hover {
          color: #dc3545;
        }
        
        &:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .upload-controls {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
    
    .cancel-btn {
      background-color: #f8f9fa;
      color: #333;
      border: 1px solid #ddd;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #e9ecef;
      }
      
      &:disabled {
        background-color: #f8f9fa;
        color: #ccc;
        cursor: not-allowed;
      }
    }
    
    .upload-btn {
      background-color: #2196f3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover {
        background-color: #0b7dda;
      }
      
      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
    }
  }
}
</style>
