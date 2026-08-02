package cd.genuc.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CookieTokenService {

    @Value("${genuc.cookie.token-name:genuc_token}")
    private String tokenName;

    @Value("${genuc.cookie.refresh-token-name:genuc_refresh_token}")
    private String refreshTokenName;

    @Value("${genuc.cookie.domain:}")
    private String cookieDomain;

    @Value("${genuc.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${genuc.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${genuc.cookie.max-age-access:3600}")
    private int accessTokenMaxAge;

    @Value("${genuc.cookie.max-age-refresh:86400}")
    private int refreshTokenMaxAge;

    @Value("${genuc.cookie.http-only:true}")
    private boolean httpOnly;

    @Value("${genuc.cookie.path:/}")
    private String cookiePath;

    public void setAccessTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = createCookie(tokenName, token, accessTokenMaxAge);
        response.addHeader("Set-Cookie", buildSetCookieHeader(cookie));
    }

    public void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = createCookie(refreshTokenName, token, refreshTokenMaxAge);
        response.addHeader("Set-Cookie", buildSetCookieHeader(cookie));
    }

    public void clearAccessTokenCookie(HttpServletResponse response) {
        Cookie cookie = createCookie(tokenName, "", 0);
        response.addHeader("Set-Cookie", buildSetCookieHeader(cookie));
    }

    public void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = createCookie(refreshTokenName, "", 0);
        response.addHeader("Set-Cookie", buildSetCookieHeader(cookie));
    }

    private Cookie createCookie(String name, String value, int maxAgeSeconds) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(httpOnly);
        cookie.setSecure(cookieSecure);
        cookie.setPath(cookiePath);
        cookie.setMaxAge(maxAgeSeconds);
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            cookie.setDomain(cookieDomain);
        }
        return cookie;
    }

    private String buildSetCookieHeader(Cookie cookie) {
        StringBuilder header = new StringBuilder();
        header.append(cookie.getName()).append("=").append(cookie.getValue());
        header.append("; Path=").append(cookie.getPath());
        header.append("; Max-Age=").append(cookie.getMaxAge());
        if (cookie.getDomain() != null) {
            header.append("; Domain=").append(cookie.getDomain());
        }
        header.append("; HttpOnly");
        if (cookieSecure) {
            header.append("; Secure");
        }
        header.append("; SameSite=").append(cookieSameSite);
        return header.toString();
    }
}