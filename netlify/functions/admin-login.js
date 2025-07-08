const { createResponse, ADMIN_PASSWORD } = require('./utils/data');

exports.handler = async (event, context) => {
    const { httpMethod, headers, body } = event;
    
    // CORS 처리
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        if (httpMethod === 'POST') {
            // 관리자 로그인
            const parsedBody = JSON.parse(body);
            const { password } = parsedBody;
            
            if (password === ADMIN_PASSWORD) {
                return createResponse(200, {
                    success: true,
                    token: ADMIN_PASSWORD,
                    message: '로그인 성공'
                });
            } else {
                return createResponse(401, {
                    success: false,
                    message: '비밀번호가 틀렸습니다.'
                });
            }
        }

        return createResponse(405, { error: '허용되지 않는 메소드입니다.' });
    } catch (error) {
        console.error('관리자 로그인 API 오류:', error);
        return createResponse(500, { error: '서버 오류가 발생했습니다.' });
    }
}; 