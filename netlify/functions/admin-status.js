const { requireAuth, createResponse } = require('./utils/data');

exports.handler = async (event, context) => {
    const { httpMethod, headers } = event;
    
    // CORS 처리
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        if (httpMethod === 'GET') {
            // 관리자 인증 상태 확인
            const isAdmin = requireAuth(headers);
            return createResponse(200, { isAdmin });
        }

        return createResponse(405, { error: '허용되지 않는 메소드입니다.' });
    } catch (error) {
        console.error('관리자 상태 확인 API 오류:', error);
        return createResponse(500, { error: '서버 오류가 발생했습니다.' });
    }
}; 