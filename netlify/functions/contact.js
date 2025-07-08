const { requireAuth, createResponse } = require('./utils/data');
const { connectToDatabase, initializeData, Contact } = require('./utils/mongodb');

exports.handler = async (event, context) => {
    const { httpMethod, headers, body } = event;
    
    // CORS 처리
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        switch (httpMethod) {
            case 'GET':
                // 연락처 정보 조회
                await connectToDatabase();
                await initializeData();
                
                const contact = await Contact.findOne();
                return createResponse(200, contact);

            case 'PUT':
                // 연락처 정보 수정
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                await connectToDatabase();
                await initializeData();

                const parsedBody = JSON.parse(body);
                const currentContact = await Contact.findOne();
                
                const updateData = {
                    phone: {
                        number: parsedBody.phone_number || currentContact.phone.number,
                        hours: parsedBody.phone_hours || currentContact.phone.hours
                    },
                    email: {
                        address: parsedBody.email_address || currentContact.email.address,
                        hours: parsedBody.email_hours || currentContact.email.hours
                    },
                    kakao: {
                        id: parsedBody.kakao_id || currentContact.kakao.id,
                        hours: parsedBody.kakao_hours || currentContact.kakao.hours
                    }
                };

                const updatedContact = await Contact.findOneAndUpdate(
                    {},
                    updateData,
                    { new: true }
                );

                return createResponse(200, updatedContact);

            default:
                return createResponse(405, { error: '허용되지 않는 메소드입니다.' });
        }
    } catch (error) {
        console.error('연락처 API 오류:', error);
        return createResponse(500, { error: '서버 오류가 발생했습니다.' });
    }
}; 