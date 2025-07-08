const multiparty = require('multiparty');
const { 
    connectToDatabase, 
    getNextId, 
    uploadImageToGridFS, 
    Review, 
    Branch 
} = require('./utils/mongodb');

// 관리자 비밀번호 확인 함수
function checkAdminAuth(event) {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    
    const password = authHeader.substring(7);
    return password === process.env.ADMIN_PASSWORD || password === 'admin123';
}

// 응답 헤더 설정
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
    // CORS 프리플라이트 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        await connectToDatabase();
        
        const { httpMethod, path, queryStringParameters } = event;
        
        // 경로 분석
        const pathParts = path.split('/').filter(Boolean);
        const reviewsIndex = pathParts.indexOf('reviews');
        const action = pathParts[reviewsIndex + 1];
        const param = pathParts[reviewsIndex + 2];

        switch (httpMethod) {
            case 'GET':
                if (action === 'random') {
                    // 랜덤 후기 조회
                    const count = parseInt(param) || 3;
                    const activeReviews = await Review.find({ isActive: true });
                    
                    if (activeReviews.length === 0) {
                        return {
                            statusCode: 200,
                            headers: corsHeaders,
                            body: JSON.stringify([])
                        };
                    }
                    
                    // 랜덤 선택
                    const shuffled = activeReviews.sort(() => 0.5 - Math.random());
                    const randomReviews = shuffled.slice(0, count);
                    
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(randomReviews)
                    };
                    
                } else if (action === 'branch') {
                    // 지점별 후기 조회
                    const branchId = parseInt(param);
                    const reviews = await Review.find({ 
                        branchId: branchId, 
                        isActive: true 
                    }).sort({ createdAt: -1 });
                    
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(reviews)
                    };
                    
                } else {
                    // 전체 후기 조회
                    const reviews = await Review.find().sort({ createdAt: -1 });
                    
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(reviews)
                    };
                }
                
            case 'POST':
                // 관리자 권한 확인
                if (!checkAdminAuth(event)) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: '인증이 필요합니다' })
                    };
                }
                
                // 새 후기 생성
                return new Promise((resolve, reject) => {
                    const form = new multiparty.Form();
                    
                    form.parse(event.body, async (err, fields, files) => {
                        if (err) {
                            resolve({
                                statusCode: 400,
                                headers: corsHeaders,
                                body: JSON.stringify({ error: '폼 데이터 파싱 실패' })
                            });
                            return;
                        }
                        
                        try {
                            const reviewData = {
                                id: await getNextId(Review),
                                branchId: parseInt(fields.branchId[0]),
                                branchName: fields.branchName[0],
                                customerName: fields.customerName[0],
                                rating: parseInt(fields.rating[0]),
                                comment: fields.comment[0],
                                image: '',
                                isActive: fields.isActive ? fields.isActive[0] === 'true' : true
                            };
                            
                            // 이미지 파일 업로드 처리
                            if (files.image && files.image[0] && files.image[0].size > 0) {
                                const imageFile = files.image[0];
                                const buffer = require('fs').readFileSync(imageFile.path);
                                const imageUrl = await uploadImageToGridFS(
                                    buffer,
                                    imageFile.originalFilename,
                                    imageFile.headers['content-type']
                                );
                                reviewData.image = imageUrl;
                            }
                            
                            const newReview = new Review(reviewData);
                            await newReview.save();
                            
                            resolve({
                                statusCode: 201,
                                headers: corsHeaders,
                                body: JSON.stringify(newReview)
                            });
                            
                        } catch (error) {
                            console.error('후기 생성 오류:', error);
                            resolve({
                                statusCode: 500,
                                headers: corsHeaders,
                                body: JSON.stringify({ error: '후기 생성 실패' })
                            });
                        }
                    });
                });
                
            case 'PUT':
                // 관리자 권한 확인
                if (!checkAdminAuth(event)) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: '인증이 필요합니다' })
                    };
                }
                
                // 후기 수정
                return new Promise((resolve, reject) => {
                    const form = new multiparty.Form();
                    
                    form.parse(event.body, async (err, fields, files) => {
                        if (err) {
                            resolve({
                                statusCode: 400,
                                headers: corsHeaders,
                                body: JSON.stringify({ error: '폼 데이터 파싱 실패' })
                            });
                            return;
                        }
                        
                        try {
                            const reviewId = parseInt(fields.id[0]);
                            const review = await Review.findOne({ id: reviewId });
                            
                            if (!review) {
                                resolve({
                                    statusCode: 404,
                                    headers: corsHeaders,
                                    body: JSON.stringify({ error: '후기를 찾을 수 없습니다' })
                                });
                                return;
                            }
                            
                            // 업데이트 데이터 준비
                            const updateData = {
                                branchId: parseInt(fields.branchId[0]),
                                branchName: fields.branchName[0],
                                customerName: fields.customerName[0],
                                rating: parseInt(fields.rating[0]),
                                comment: fields.comment[0],
                                isActive: fields.isActive ? fields.isActive[0] === 'true' : true
                            };
                            
                            // 이미지 파일 업로드 처리
                            if (files.image && files.image[0] && files.image[0].size > 0) {
                                const imageFile = files.image[0];
                                const buffer = require('fs').readFileSync(imageFile.path);
                                const imageUrl = await uploadImageToGridFS(
                                    buffer,
                                    imageFile.originalFilename,
                                    imageFile.headers['content-type']
                                );
                                updateData.image = imageUrl;
                            }
                            
                            const updatedReview = await Review.findOneAndUpdate(
                                { id: reviewId },
                                updateData,
                                { new: true }
                            );
                            
                            resolve({
                                statusCode: 200,
                                headers: corsHeaders,
                                body: JSON.stringify(updatedReview)
                            });
                            
                        } catch (error) {
                            console.error('후기 수정 오류:', error);
                            resolve({
                                statusCode: 500,
                                headers: corsHeaders,
                                body: JSON.stringify({ error: '후기 수정 실패' })
                            });
                        }
                    });
                });
                
            case 'DELETE':
                // 관리자 권한 확인
                if (!checkAdminAuth(event)) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: '인증이 필요합니다' })
                    };
                }
                
                // 후기 삭제
                const reviewId = parseInt(param);
                const deletedReview = await Review.findOneAndDelete({ id: reviewId });
                
                if (!deletedReview) {
                    return {
                        statusCode: 404,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: '후기를 찾을 수 없습니다' })
                    };
                }
                
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: '후기가 삭제되었습니다' })
                };
                
            default:
                return {
                    statusCode: 405,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: '지원하지 않는 HTTP 메서드입니다' })
                };
        }
        
    } catch (error) {
        console.error('API 오류:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: '서버 오류가 발생했습니다' })
        };
    }
}; 