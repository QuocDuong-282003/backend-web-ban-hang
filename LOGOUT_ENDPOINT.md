# Logout Endpoint - Xử lý vấn đề tự động login lại sau khi logout

## 🔍 Vấn đề

Sau khi logout, khi reload trang thì tự động quay lại trạng thái login.

**Nguyên nhân:** Cookie HTTPOnly vẫn còn tồn tại sau khi logout, nên khi reload, frontend check auth bằng `/api/me` và thấy cookie còn nên tự động login lại.

## ✅ Giải pháp

Đã tạo endpoint `POST /api/auth/logout` để clear cookie đúng cách.

### Backend Endpoint

**POST `/api/auth/logout`**

- Clear cookie HTTPOnly `token`
- Trả về: `{ success: true, message: "Logout successful" }`

### Frontend Code

**File: `src/services/api.js`**

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // QUAN TRỌNG!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Logout function
export const logout = async () => {
  try {
    const response = await API.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export default API;
```

**File: Component sử dụng**

```javascript
import { logout } from '../services/api';

const handleLogout = async () => {
  try {
    // Gọi API logout để clear cookie
    await logout();
    
    // Clear state/localStorage nếu có
    setUser(null);
    localStorage.removeItem('user'); // Nếu có lưu user trong localStorage
    
    // Redirect về trang login
    navigate('/login');
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Vẫn clear state và redirect dù có lỗi
    setUser(null);
    navigate('/login');
  }
};
```

## 🔧 Cách hoạt động

1. **Frontend gọi `POST /api/auth/logout`**
2. **Backend clear cookie** với cùng settings như khi set (domain, path, secure, sameSite)
3. **Backend set cookie với expires = 0** để đảm bảo xóa hoàn toàn
4. **Frontend clear state** và redirect về login

## ⚠️ Lưu ý

- **Phải gọi API logout** - Không thể xóa cookie HTTPOnly bằng JavaScript
- **Phải có `withCredentials: true`** trong axios config
- **Clear state sau khi logout** - Để UI không còn hiển thị user info
- **Redirect về login** sau khi logout thành công

## ✅ Checklist

- [ ] Frontend có function `logout()` gọi `POST /api/auth/logout`
- [ ] Axios config có `withCredentials: true`
- [ ] Clear state sau khi logout
- [ ] Redirect về login sau khi logout
- [ ] Test: Logout → Reload → Không tự động login lại

---

**Sau khi implement, vấn đề sẽ được fix!**

