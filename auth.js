(function () {
    const TOKEN_KEY = "pokemon-auth-access-token";
    const USER_KEY = "pokemon-auth-user";

    async function request(path, options = {}) {
        const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(path, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error_description || data.message || data.error || "Request failed");
        return data;
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
    }

    function setSession(data) {
        if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
        if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function injectAuthUi() {
        const header = document.querySelector(".header");
        if (!header || header.querySelector(".auth-controls")) return;
        const controls = document.createElement("div");
        controls.className = "auth-controls";
        controls.innerHTML = getUser()
            ? `<span class="auth-user"></span><button type="button" class="auth-button auth-logout">Đăng xuất</button>`
            : `<button type="button" class="auth-button auth-login">Đăng nhập</button>`;
        header.appendChild(controls);
        const user = getUser();
        if (user) controls.querySelector(".auth-user").textContent = user.email || "Tài khoản";
        controls.querySelector(".auth-login")?.addEventListener("click", () => openAuthModal("login"));
        controls.querySelector(".auth-logout")?.addEventListener("click", () => { clearSession(); window.location.reload(); });
    }

    function openAuthModal(mode) {
        let modal = document.getElementById("auth-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "auth-modal";
            modal.className = "auth-modal";
            modal.innerHTML = `<div class="auth-panel"><button type="button" class="auth-close">×</button><h2 class="auth-title"></h2><form class="auth-form"><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Mật khẩu" minlength="6" required><button type="submit" class="auth-submit"></button></form><button type="button" class="auth-switch"></button><p class="auth-status" role="status"></p></div>`;
            document.body.appendChild(modal);
            modal.querySelector(".auth-close").addEventListener("click", () => modal.remove());
        }
        const signup = mode === "signup";
        modal.querySelector(".auth-title").textContent = signup ? "Tạo tài khoản" : "Đăng nhập";
        modal.querySelector(".auth-submit").textContent = signup ? "Đăng ký" : "Đăng nhập";
        modal.querySelector(".auth-switch").textContent = signup ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký";
        modal.querySelector(".auth-status").textContent = "";
        modal.hidden = false;
        modal.querySelector(".auth-switch").onclick = () => openAuthModal(signup ? "login" : "signup");
        modal.querySelector(".auth-form").onsubmit = async event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const status = modal.querySelector(".auth-status");
            status.textContent = "Đang xử lý...";
            try {
                const data = await request("/api/auth", { method: "POST", body: JSON.stringify({ action: signup ? "signup" : "login", email: form.get("email"), password: form.get("password") }) });
                if (!data.access_token) throw new Error("Hãy kiểm tra email để xác nhận tài khoản.");
                setSession(data);
                window.location.reload();
            } catch (error) { status.textContent = error.message; }
        };
    }

    window.AppApi = { request, getUser, setSession, clearSession };
    window.AppAuth = { open: openAuthModal, getUser, clear: clearSession };
    document.addEventListener("DOMContentLoaded", injectAuthUi);
})();