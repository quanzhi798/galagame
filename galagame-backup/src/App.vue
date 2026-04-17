<template>
  <div class="app">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="container">
        <h1 class="logo">AI剧本杀</h1>
        <div class="nav-links">
          <a href="#" @click.prevent="activeView = 'dashboard'">首页</a>
          <a href="#" @click.prevent="activeView = 'scripts'" v-if="isLoggedIn">剧本管理</a>
          <a href="#" @click.prevent="activeView = 'settings'" v-if="isLoggedIn">设置</a>
          <div v-if="!isLoggedIn">
            <a href="#" @click.prevent="showLoginModal = true" class="login-btn">登录</a>
            <a href="#" @click.prevent="showRegisterModal = true" class="register-btn">注册</a>
          </div>
          <div v-else class="user-info">
            <div class="user-avatar" v-if="currentUser?.avatar">
              <img :src="currentUser.avatar" :alt="currentUser.username" />
            </div>
            <div class="user-avatar default" v-else>
              <span>{{ currentUser?.username.charAt(0) }}</span>
            </div>
            <span>{{ currentUser?.username }}</span>
            <span class="balance">余额: {{ currentUser?.balance || 0 }} Token</span>
            <a href="#" @click.prevent="showRechargeModal = true; fetchRechargeRecords()" class="recharge-btn">充值</a>
            <a href="#" @click.prevent="showGameHistory = true; fetchGameHistory()" class="history-btn">历史</a>
            <a href="#" @click.prevent="logout" class="logout-btn">退出</a>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container">
        <!-- 首页视图 -->
        <div v-if="activeView === 'dashboard'" class="dashboard">
          <h2>欢迎来到AI剧本杀平台</h2>
          <p>选择一个剧本开始你的冒险</p>
          
          <div class="script-grid">
            <div 
              v-for="script in scripts" 
              :key="script.id" 
              class="script-card"
              @click="startScript(script)"
            >
              <div class="script-cover">
                <img :src="script.cover" :alt="script.name" />
              </div>
              <div class="script-info">
                <h3>{{ script.name }}</h3>
                <p>{{ script.description }}</p>
                <button class="btn start-btn">开始游戏</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 剧本管理视图 -->
        <div v-if="activeView === 'scripts'" class="script-management">
          <h2>剧本管理</h2>
          <button class="btn add-btn" @click="showAddScriptModal = true">添加新剧本</button>
          
          <div class="script-list">
            <div 
              v-for="script in scripts" 
              :key="script.id" 
              class="script-item"
            >
              <div class="script-item-cover">
                <img :src="script.cover" :alt="script.name" />
              </div>
              <div class="script-item-info">
                <h3>{{ script.name }}</h3>
                <p>{{ script.description }}</p>
              </div>
              <div class="script-item-actions">
                <button class="btn edit-btn" @click="editScript(script)">编辑</button>
                <button class="btn delete-btn" @click="deleteScript(script.id)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话视图 -->
        <div v-if="activeView === 'chat'" class="chat-container">
          <div class="chat-header">
            <button class="btn back-btn" @click="activeView = 'dashboard'">返回</button>
            <h2>{{ currentScript?.name }}</h2>
            <div class="header-actions">
              <button class="btn save-btn" @click="createSavePoint" v-if="isLoggedIn">创建存档</button>
              <button class="btn load-btn" @click="showGameHistory = true; fetchGameHistory(); fetchSavePoints()" v-if="isLoggedIn">历史与存档</button>
              <button class="btn load-btn" @click="alert('请先登录')" v-else>历史与存档</button>
            </div>
          </div>
          
          <div class="chat-messages">
            <div 
              v-for="(message, index) in messages" 
              :key="index"
              :class="['message', message.type]"
            >
              <div class="message-content">
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              type="text" 
              v-model="inputMessage" 
              placeholder="输入你的对话..."
              @keyup.enter="sendMessage"
            />
            <button class="btn send-btn" @click="sendMessage">发送</button>
          </div>
          
          <!-- 交易信息显示 -->
          <div v-if="lastTransaction" class="transaction-info">
            <span class="cost">-{{ lastTransaction.cost }}</span>
            <span class="reward">+{{ lastTransaction.reward }}</span>
            <span class="net">{{ lastTransaction.message }}</span>
          </div>
        </div>

        <!-- 设置视图 -->
        <div v-if="activeView === 'settings'" class="settings">
          <h2>设置</h2>
          <div class="settings-section">
            <h3>用户设置</h3>
            <div class="setting-item">
              <label>用户名</label>
              <input type="text" v-model="userSettings.username" />
            </div>
            <div class="setting-item">
              <label>头像</label>
              <input type="file" @change="handleAvatarUpload" />
            </div>
          </div>
          <div class="settings-section">
            <h3>AI设置</h3>
            <div class="setting-item">
              <label>AI模型</label>
              <select v-model="aiSettings.model">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            <div class="setting-item">
              <label>API密钥</label>
              <input type="password" v-model="aiSettings.apiKey" />
            </div>
          </div>
          <button class="btn save-btn" @click="saveSettings">保存设置</button>
        </div>
      </div>
    </main>

    <!-- 添加/编辑剧本模态框 -->
    <div v-if="showAddScriptModal || showEditScriptModal" class="modal">
      <div class="modal-content">
        <h3>{{ showEditScriptModal ? '编辑剧本' : '添加新剧本' }}</h3>
        <div class="form-group">
          <label>剧本名称</label>
          <input type="text" v-model="formData.name" />
        </div>
        <div class="form-group">
          <label>剧本描述</label>
          <textarea v-model="formData.description"></textarea>
        </div>
        <div class="form-group">
          <label>封面图片</label>
          <input type="file" @change="handleCoverUpload" />
        </div>
        <div class="form-group">
          <label>AI模型</label>
          <select v-model="formData.aiModel">
            <option value="free">免费模型</option>
            <option value="premium">付费模型</option>
          </select>
        </div>
        <div class="form-group">
          <label>结局设置</label>
          <textarea v-model="formData.endings"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="closeModal">取消</button>
          <button class="btn save-btn" @click="saveScript">保存</button>
        </div>
      </div>
    </div>

    <!-- 登录模态框 -->
    <div v-if="showLoginModal" class="modal">
      <div class="modal-content">
        <h3>登录</h3>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="loginForm.username" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" v-model="loginForm.password" />
        </div>
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="showLoginModal = false">取消</button>
          <button class="btn save-btn" @click="login">登录</button>
        </div>
        <div class="modal-footer">
          <p>还没有账号？<a href="#" @click.prevent="showLoginModal = false; showRegisterModal = true">立即注册</a></p>
        </div>
      </div>
    </div>

    <!-- 注册模态框 -->
    <div v-if="showRegisterModal" class="modal">
      <div class="modal-content">
        <h3>注册</h3>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="registerForm.username" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" v-model="registerForm.password" />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input type="password" v-model="registerForm.confirmPassword" />
        </div>
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="showRegisterModal = false">取消</button>
          <button class="btn save-btn" @click="register">注册</button>
        </div>
        <div class="modal-footer">
          <p>已有账号？<a href="#" @click.prevent="showRegisterModal = false; showLoginModal = true">立即登录</a></p>
        </div>
      </div>
    </div>

    <!-- 充值模态框 -->
    <div v-if="showRechargeModal" class="modal">
      <div class="modal-content recharge-modal">
        <h3>Token充值</h3>
        <p class="current-balance">当前余额: <strong>{{ currentUser?.balance || 0 }} Token</strong></p>
        
        <div class="packages-grid">
          <div 
            v-for="pkg in tokenPackages" 
            :key="pkg.id"
            class="package-card"
            @click="recharge(pkg.id)"
          >
            <h4>{{ pkg.name }}</h4>
            <div class="token-amount">{{ pkg.tokens }} Token</div>
            <div class="price">¥{{ pkg.price }}</div>
            <p class="description">{{ pkg.description }}</p>
          </div>
        </div>
        
        <div v-if="rechargeRecords.length > 0" class="recharge-history">
          <h4>充值记录</h4>
          <div class="records-list">
            <div v-for="record in rechargeRecords" :key="record.id" class="record-item">
              <span class="record-name">{{ record.packageName }}</span>
              <span class="record-tokens">+{{ record.tokens }} Token</span>
              <span class="record-date">{{ new Date(record.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="showRechargeModal = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 游戏历史记录模态框 -->
    <div v-if="showGameHistory" class="modal">
      <div class="modal-content history-modal">
        <h3>历史与存档</h3>
        
        <!-- 游戏历史记录 -->
        <div class="history-section">
          <h4>游戏历史</h4>
          <div v-if="gameHistory.length === 0" class="empty-history">
            <p>暂无游戏历史记录</p>
          </div>
          
          <div v-else class="history-list">
            <div 
              v-for="record in gameHistory" 
              :key="record.scriptId"
              class="history-item"
            >
              <div class="history-item-left">
                <img :src="record.scriptCover" :alt="record.scriptName" class="history-cover" />
                <div class="history-info">
                  <h5>{{ record.scriptName }}</h5>
                  <p class="history-desc">{{ record.scriptDescription }}</p>
                  <div class="history-meta">
                    <span>首次游玩: {{ new Date(record.firstPlayedAt).toLocaleString() }}</span>
                    <span>最近游玩: {{ new Date(record.lastPlayedAt).toLocaleString() }}</span>
                    <span>消息数: {{ record.totalMessages }}</span>
                  </div>
                </div>
              </div>
              <div class="history-item-right">
                <button 
                  class="btn play-btn"
                  @click="resumeScript(record)"
                >
                  继续游戏
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 存档列表 -->
        <div class="history-section">
          <h4>存档节点</h4>
          <div v-if="savePoints.length === 0" class="empty-history">
            <p>暂无存档记录</p>
          </div>
          
          <div v-else class="save-points-list">
            <div 
              v-for="savePoint in savePoints" 
              :key="savePoint.id"
              class="save-point-item"
              @click="loadSavePoint(savePoint)"
            >
              <div class="save-point-info">
                <span class="save-point-name">{{ savePoint.name }}</span>
                <span class="save-point-time">{{ new Date(savePoint.timestamp).toLocaleString() }}</span>
              </div>
              <button class="btn delete-save-btn" @click.stop="deleteSavePoint(savePoint.id)">删除</button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="showGameHistory = false">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- 创建存档模态框 -->
    <div v-if="showSavePointModal" class="modal">
      <div class="modal-content">
        <h3>创建存档</h3>
        <div class="form-group">
          <label>存档名称</label>
          <input type="text" v-model="savePointName" placeholder="请输入存档名称" />
        </div>
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="cancelCreateSavePoint">取消</button>
          <button class="btn save-btn" @click="confirmCreateSavePoint">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 确认模态框 -->
    <div v-if="showConfirmModal" class="modal">
      <div class="modal-content">
        <h3>{{ confirmModalTitle }}</h3>
        <p>{{ confirmModalMessage }}</p>
        <div class="modal-actions">
          <button class="btn cancel-btn" @click="cancelConfirm">取消</button>
          <button class="btn save-btn" @click="confirmAction">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeView: 'dashboard',
      isLoggedIn: false,
      currentUser: null,
      showLoginModal: false,
      showRegisterModal: false,
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      scripts: [
        {
          id: 1,
          name: '财阀人生',
          description: '你是掌控娱乐圈半壁江山的顶级财阀，享受你的夜生活',
          cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20nightclub%20scene%20with%20wealthy%20people&image_size=landscape_16_9',
          aiModel: 'free',
          endings: '多种结局取决于你的选择'
        }
      ],
      currentScript: null,
      messages: [],
      inputMessage: '',
      savePoints: [], // 存档节点列表
      showAddScriptModal: false,
      showEditScriptModal: false,
      formData: {
        name: '',
        description: '',
        cover: '',
        aiModel: 'free',
        endings: ''
      },
      userSettings: {
        username: '玩家',
        avatar: ''
      },
      aiSettings: {
        model: 'gpt-3.5-turbo',
        apiKey: ''
      },
      tokenPackages: [],
      rechargeRecords: [],
      showRechargeModal: false,
      lastTransaction: null,
      gameHistory: [],
      showGameHistory: false,
      showSavePoints: false,
      showSavePointModal: false,
      savePointName: '',
      showConfirmModal: false,
      selectedSavePoint: null,
      confirmModalTitle: '',
      confirmModalMessage: '',
      confirmActionType: '',
      selectedSavePointIndex: -1,
      selectedSavePointId: ''
    }
  },
  mounted() {
    // 检查localStorage中的token
    const token = localStorage.getItem('token');
    if (token) {
      // 这里可以添加验证token的逻辑
      // 暂时简单处理，直接设置为登录状态
      this.isLoggedIn = true;
      this.currentUser = { username: '用户' };
    }
    
    // 获取剧本列表
    this.fetchScripts();
    
    // 获取充值套餐
    this.fetchTokenPackages();
  },
  methods: {
    async fetchScripts() {
      try {
        const response = await fetch('http://localhost:3001/api/scripts');
        const data = await response.json();
        if (response.ok) {
          this.scripts = data.scripts;
        }
      } catch (error) {
        console.error('获取剧本列表失败:', error);
      }
    },
    async fetchTokenPackages() {
      try {
        const response = await fetch('http://localhost:3001/api/token-packages');
        const data = await response.json();
        if (response.ok) {
          this.tokenPackages = data.packages;
        }
      } catch (error) {
        console.error('获取充值套餐失败:', error);
      }
    },
    async fetchRechargeRecords() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3001/api/recharge-records', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          this.rechargeRecords = data.records;
        }
      } catch (error) {
        console.error('获取充值记录失败:', error);
      }
    },
    async fetchGameHistory() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3001/api/game-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          this.gameHistory = data.history;
        }
      } catch (error) {
        console.error('获取游戏历史记录失败:', error);
      }
    },
    async recharge(packageId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('请先登录');
          return;
        }
        
        const response = await fetch('http://localhost:3001/api/recharge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ packageId })
        });
        
        const data = await response.json();
        if (response.ok) {
          // 更新用户余额
          if (this.currentUser) {
            this.currentUser.balance = data.balance;
          }
          alert(data.message);
          this.showRechargeModal = false;
          // 刷新充值记录
          this.fetchRechargeRecords();
        } else {
          alert(data.message || '充值失败');
        }
      } catch (error) {
        alert('充值失败：' + error.message);
      }
    },
    resumeScript(record) {
      // 构建剧本对象
      const script = {
        id: record.scriptId,
        name: record.scriptName,
        description: record.scriptDescription,
        cover: record.scriptCover
      };
      
      // 开始游戏
      this.startScript(script);
      this.showGameHistory = false;
    },
    startScript(script) {
      this.currentScript = script
      this.messages = [
        {
          type: 'ai',
          content: `欢迎来到《${script.name}》剧本！${script.description}`
        }
      ]
      this.activeView = 'chat'
    },
    async sendMessage() {
      if (this.inputMessage.trim()) {
        this.messages.push({
          type: 'user',
          content: this.inputMessage
        })
        
        // 显示加载状态
        const loadingMessageId = Date.now()
        this.messages.push({
          type: 'ai',
          content: 'AI正在思考...',
          id: loadingMessageId,
          loading: true
        })
        
        try {
          // 调用后端AI对话代理接口
          const response = await fetch('http://localhost:3001/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              model: this.aiSettings.model,
              messages: [
                {
                  role: 'system',
                  content: `你是剧本《${this.currentScript.name}》中的AI角色。${this.currentScript.description}`
                },
                ...this.messages.filter(msg => !msg.loading).map(msg => ({
                  role: msg.type === 'user' ? 'user' : 'assistant',
                  content: msg.content
                }))
              ],
              temperature: 0.7,
              scriptId: this.currentScript.id
            })
          })
          
          const data = await response.json()
          
          // 移除加载消息
          this.messages = this.messages.filter(msg => msg.id !== loadingMessageId)
          
          if (response.ok && data.choices && data.choices[0]) {
            this.messages.push({
              type: 'ai',
              content: data.choices[0].message.content
            })
            
            // 更新用户余额
            if (data.balance !== undefined) {
              this.currentUser.balance = data.balance;
            }
            
            // 显示交易信息
            if (data.message) {
              this.lastTransaction = {
                cost: data.cost,
                reward: data.reward,
                message: data.message
              };
              // 3秒后清除交易信息
              setTimeout(() => {
                this.lastTransaction = null;
              }, 3000);
            }
          } else {
            console.error('AI API Error:', data);
            let errorMsg = '未知错误';
            if (data.error) {
              if (typeof data.error === 'object') {
                errorMsg = JSON.stringify(data.error);
              } else {
                errorMsg = data.error;
              }
            } else if (data.message) {
              errorMsg = data.message;
            }
            this.messages.push({
              type: 'ai',
              content: `AI回复失败：${errorMsg}`
            })
          }
        } catch (error) {
          // 移除加载消息
          this.messages = this.messages.filter(msg => msg.id !== loadingMessageId)
          
          this.messages.push({
            type: 'ai',
            content: 'AI回复失败：' + error.message
          })
        }
        
        this.inputMessage = ''
      }
    },
    editScript(script) {
      this.formData = { ...script }
      this.showEditScriptModal = true
    },
    async deleteScript(id) {
      if (confirm('确定要删除这个剧本吗？')) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            alert('请先登录');
            return;
          }
          
          const response = await fetch(`http://localhost:3001/api/scripts/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          if (response.ok) {
            // 重新获取剧本列表
            await this.fetchScripts();
            alert(data.message);
          } else {
            alert(data.message || '删除失败');
          }
        } catch (error) {
          alert('删除失败：' + error.message);
        }
      }
    },
    async handleCoverUpload(e) {
      const file = e.target.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('type', 'cover');
          
          const response = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          const data = await response.json();
          if (response.ok) {
            this.formData.cover = data.url;
          } else {
            alert('图片上传失败：' + data.message);
          }
        } catch (error) {
          alert('图片上传失败：' + error.message);
        }
      }
    },
    async handleAvatarUpload(e) {
      const file = e.target.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('type', 'avatar');
          
          const response = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          const data = await response.json();
          if (response.ok) {
            this.userSettings.avatar = data.url;
            // 更新当前用户的头像
            if (this.currentUser) {
              this.currentUser.avatar = data.url;
            }
          } else {
            alert('头像上传失败：' + data.message);
          }
        } catch (error) {
          alert('头像上传失败：' + error.message);
        }
      }
    },
    async saveScript() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('请先登录');
          return;
        }
        
        let response;
        if (this.showEditScriptModal) {
          // 更新剧本
          response = await fetch(`http://localhost:3001/api/scripts/${this.formData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(this.formData)
          });
        } else {
          // 创建剧本
          response = await fetch('http://localhost:3001/api/scripts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(this.formData)
          });
        }
        
        const data = await response.json();
        if (response.ok) {
          // 重新获取剧本列表
          await this.fetchScripts();
          this.closeModal();
          alert(data.message);
        } else {
          alert(data.message || '操作失败');
        }
      } catch (error) {
        alert('操作失败：' + error.message);
      }
    },
    closeModal() {
      this.showAddScriptModal = false
      this.showEditScriptModal = false
      this.formData = {
        name: '',
        description: '',
        cover: '',
        aiModel: 'free',
        endings: ''
      }
    },
    saveSettings() {
      // 模拟保存设置
      alert('设置已保存！')
    },
    async login() {
      // 真正的登录
      if (this.loginForm.username && this.loginForm.password) {
        try {
          const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.loginForm)
          });
          
          const data = await response.json();
          
          if (response.ok) {
            this.isLoggedIn = true
            this.currentUser = data.user
            localStorage.setItem('token', data.token)
            this.showLoginModal = false
            this.loginForm = {
              username: '',
              password: ''
            }
            alert('登录成功！')
          } else {
            alert(data.message || '登录失败')
          }
        } catch (error) {
          alert('登录失败：' + error.message)
        }
      } else {
        alert('请输入用户名和密码')
      }
    },
    async register() {
      // 真正的注册
      if (this.registerForm.username && this.registerForm.password && this.registerForm.confirmPassword) {
        if (this.registerForm.password === this.registerForm.confirmPassword) {
          try {
            const response = await fetch('http://localhost:3001/api/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                username: this.registerForm.username,
                password: this.registerForm.password
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              this.isLoggedIn = true
              this.currentUser = data.user
              localStorage.setItem('token', data.token)
              this.showRegisterModal = false
              this.registerForm = {
                username: '',
                password: '',
                confirmPassword: ''
              }
              alert('注册成功！')
            } else {
              alert(data.message || '注册失败')
            }
          } catch (error) {
            alert('注册失败：' + error.message)
          }
        } else {
          alert('两次输入的密码不一致')
        }
      } else {
        alert('请填写完整的注册信息')
      }
    },
    logout() {
      // 退出登录
      this.isLoggedIn = false
      this.currentUser = null
      localStorage.removeItem('token')
      this.activeView = 'dashboard'
      alert('已退出登录！')
    },
    createSavePoint() {
      // 显示创建存档模态框
      this.savePointName = '';
      this.showSavePointModal = true;
    },
    cancelCreateSavePoint() {
      // 取消创建存档
      this.showSavePointModal = false;
      this.savePointName = '';
    },
    loadSavePoint(savePoint) {
      // 显示确认加载存档模态框
      this.selectedSavePoint = savePoint;
      this.confirmModalTitle = '加载存档';
      this.confirmModalMessage = `确定要加载存档 "${savePoint.name}" 吗？`;
      this.confirmActionType = 'load';
      this.showConfirmModal = true;
    },
    cancelConfirm() {
      // 取消确认操作
      this.showConfirmModal = false;
      this.selectedSavePoint = null;
      this.selectedSavePointId = '';
      this.confirmActionType = '';
    },
    fetchSavePoints() {
      // 从localStorage获取存档列表
      if (this.isLoggedIn && this.currentUser) {
        const userId = this.currentUser.id;
        const key = `savePoints_${userId}`;
        const savePoints = localStorage.getItem(key);
        if (savePoints) {
          try {
            this.savePoints = JSON.parse(savePoints);
            console.log('存档列表加载成功:', this.savePoints);
          } catch (error) {
            console.error('存档列表解析失败:', error);
            this.savePoints = [];
          }
        } else {
          this.savePoints = [];
        }
      }
    },
    confirmCreateSavePoint() {
      // 确认创建存档
      if (this.savePointName.trim() && this.isLoggedIn && this.currentUser) {
        const savePoint = {
          id: Date.now().toString(),
          name: this.savePointName.trim(),
          timestamp: Date.now(),
          messages: [...this.messages],
          scriptId: this.currentScript.id
        };
        console.log('创建存档:', savePoint);
        this.savePoints.push(savePoint);
        // 保存到localStorage
        this.saveSavePoints();
        this.showSavePointModal = false;
        this.savePointName = '';
        alert('存档创建成功！');
      } else {
        alert('请输入存档名称');
      }
    },
    deleteSavePoint(savePointId) {
      // 显示确认删除存档模态框
      this.selectedSavePointId = savePointId;
      this.confirmModalTitle = '删除存档';
      this.confirmModalMessage = '确定要删除这个存档吗？';
      this.confirmActionType = 'delete';
      this.showConfirmModal = true;
    },
    confirmAction() {
      // 执行确认操作
      if (this.confirmActionType === 'load') {
        // 加载存档
        this.messages = [...this.selectedSavePoint.messages];
        // 尝试获取并更新剧本信息
        if (this.selectedSavePoint.scriptId) {
          // 从剧本列表中查找对应的剧本
          const script = this.scripts.find(s => s.id === this.selectedSavePoint.scriptId);
          if (script) {
            this.currentScript = script;
          }
        }
        this.showGameHistory = false;
        this.showConfirmModal = false;
        alert('存档加载成功！');
      } else if (this.confirmActionType === 'delete') {
        // 删除存档
        if (this.isLoggedIn && this.currentUser) {
          this.savePoints = this.savePoints.filter(sp => sp.id !== this.selectedSavePointId);
          // 保存到localStorage
          this.saveSavePoints();
          this.showConfirmModal = false;
          alert('存档删除成功！');
        }
      }
    },
    saveSavePoints() {
      // 保存存档节点到localStorage
      if (this.isLoggedIn && this.currentUser) {
        const userId = this.currentUser.id;
        const key = `savePoints_${userId}`;
        console.log('保存存档到localStorage:', key, this.savePoints);
        localStorage.setItem(key, JSON.stringify(this.savePoints));
        // 验证保存是否成功
        const savedData = localStorage.getItem(key);
        console.log('存档保存验证:', savedData ? '成功' : '失败');
      }
    },
  }
}
</script>

<style scoped>
/* 全局样式 */
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 导航栏样式 */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #333;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-links a:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

/* 登录/注册按钮 */
.login-btn {
  background-color: transparent;
  color: #667eea;
  padding: 0.5rem 1.2rem;
  border: 1px solid #667eea;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.login-btn:hover {
  background-color: #667eea;
  color: white;
  transform: translateY(-2px);
}

.register-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #333;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar.default {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.balance {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
}

.logout-btn {
  background-color: #f0f0f0;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.logout-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.recharge-btn {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.3);
}

.recharge-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.4);
}

.history-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
  margin-right: 1rem;
}

.history-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

/* 主要内容 */
.main-content {
  padding: 3rem 0;
}

.main-content .container {
  flex-direction: column;
  align-items: flex-start;
}

/* 标题样式 */
.dashboard h2,
.script-management h2,
.settings h2 {
  margin-bottom: 2rem;
  color: white;
  font-size: 2.2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

/* 剧本网格 */
.script-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
}

/* 剧本卡片 */
.script-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  transform-origin: center;
}

.script-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.script-cover {
  height: 220px;
  overflow: hidden;
  position: relative;
}

.script-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.script-card:hover .script-cover img {
  transform: scale(1.1);
}

.script-info {
  padding: 1.5rem;
}

.script-info h3 {
  margin-bottom: 0.75rem;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
}

.script-info p {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.start-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  width: 100%;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

.add-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

/* 剧本列表 */
.script-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.script-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.script-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.script-item-cover {
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.script-item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.script-item:hover .script-item-cover img {
  transform: scale(1.1);
}

.script-item-info {
  flex: 1;
}

.script-item-info h3 {
  margin-bottom: 0.75rem;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.script-item-info p {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.script-item-actions {
  display: flex;
  gap: 1rem;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #f44336, #da190b);
  color: white;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.4);
}

/* 聊天容器 */
.chat-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  height: 80vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.chat-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.chat-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  text-shadow: none;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.save-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

.load-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);
}

.load-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(33, 150, 243, 0.4);
}

/* 历史区块样式 */
.history-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.history-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

/* 存档列表样式 */
.save-points-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.save-point-item {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-point-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.save-point-info {
  flex: 1;
}

.save-point-name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.save-point-time {
  display: block;
  font-size: 0.85rem;
  color: #666;
}

.delete-save-btn {
  background: linear-gradient(135deg, #f44336, #da190b);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);
}

.delete-save-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.4);
}

/* 聊天消息 */
.chat-messages {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #f9f9f9;
}

.message {
  max-width: 80%;
  padding: 1rem 1.25rem;
  border-radius: 20px;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai {
  align-self: flex-start;
  background-color: white;
  border-bottom-left-radius: 4px;
  border: 1px solid #e0e0e0;
}

/* 聊天输入 */
.chat-input {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  background-color: white;
}

.chat-input input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.chat-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.send-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.send-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

/* 设置页面 */
.settings-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.settings-section h3 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item label {
  display: block;
  margin-bottom: 0.75rem;
  color: #666;
  font-weight: 500;
  font-size: 0.95rem;
}

.setting-item input,
.setting-item select,
.setting-item textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.setting-item input:focus,
.setting-item select:focus,
.setting-item textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.setting-item textarea {
  resize: vertical;
  min-height: 120px;
}

.save-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 0.75rem 2rem;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content h3 {
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2.5rem;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #333;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.modal-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: #666;
}

.modal-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.modal-footer a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 交易信息显示 */
.transaction-info {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease;
}

.transaction-info .cost {
  color: #f44336;
  font-weight: 600;
}

.transaction-info .reward {
  color: #4CAF50;
  font-weight: 600;
}

.transaction-info .net {
  color: #666;
}

/* 充值模态框样式 */
.recharge-modal {
  max-width: 700px;
}

.current-balance {
  text-align: center;
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.current-balance strong {
  color: #667eea;
  font-size: 1.3rem;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.package-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.package-card:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.package-card h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.package-card .token-amount {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.package-card .price {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.package-card .description {
  font-size: 0.8rem;
  opacity: 0.8;
  line-height: 1.3;
}

.recharge-history {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.recharge-history h4 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1rem;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
}

.record-item .record-name {
  color: #333;
  font-weight: 500;
}

.record-item .record-tokens {
  color: #4CAF50;
  font-weight: 600;
}

.record-item .record-date {
  color: #999;
  font-size: 0.8rem;
}

/* 游戏历史记录模态框样式 */
.history-modal {
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.empty-history {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.history-item {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.history-item-left {
  flex: 1;
  display: flex;
  gap: 1.5rem;
}

.history-cover {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
}

.history-info h4 {
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1.1rem;
}

.history-desc {
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #999;
}

.history-item-right {
  margin-left: 1.5rem;
  flex-shrink: 0;
}

.play-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.3);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .nav-links {
    width: 100%;
    justify-content: space-between;
  }
  
  .script-grid {
    grid-template-columns: 1fr;
  }
  
  .script-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .script-item-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .chat-messages {
    padding: 1rem;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>