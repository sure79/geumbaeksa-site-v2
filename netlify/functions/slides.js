const { readSlides, writeSlides, requireAuth, createResponse } = require('./utils/data');
const multipart = require('lambda-multipart-parser');
const cloudinary = require('cloudinary').v2;

// Cloudinary 설정
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

exports.handler = async (event, context) => {
    const { httpMethod, path, headers, body } = event;
    
    // CORS 처리
    if (httpMethod === 'OPTIONS') {
        return createResponse(200, {});
    }

    try {
        // 경로에서 ID 추출
        const pathParts = path.split('/');
        const id = pathParts[pathParts.length - 1];
        const isIdPath = !isNaN(parseInt(id));

        switch (httpMethod) {
            case 'GET':
                if (isIdPath) {
                    // 특정 슬라이드 조회
                    const data = readSlides();
                    const slide = data.slides.find(s => s.id === parseInt(id));
                    
                    if (!slide) {
                        return createResponse(404, { error: '슬라이드를 찾을 수 없습니다.' });
                    }
                    
                    return createResponse(200, slide);
                } else {
                    // 모든 슬라이드 조회
                    const data = readSlides();
                    return createResponse(200, data.slides);
                }

            case 'POST':
                // 슬라이드 추가
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                let parsedBody;
                let imageFile = null;

                // 멀티파트 데이터 처리
                if (headers['content-type'] && headers['content-type'].includes('multipart/form-data')) {
                    const result = await multipart.parse(event);
                    parsedBody = result.files ? result : { ...result };
                    imageFile = result.files && result.files.length > 0 ? result.files[0] : null;
                } else {
                    parsedBody = JSON.parse(body);
                }

                const data = readSlides();
                let imageUrl = parsedBody.image || '/korea-map.svg';

                // 이미지 업로드 처리
                if (imageFile && process.env.CLOUDINARY_CLOUD_NAME) {
                    try {
                        const uploadResult = await cloudinary.uploader.upload(
                            `data:${imageFile.contentType};base64,${imageFile.content.toString('base64')}`,
                            {
                                folder: 'geumbaeksa/slides',
                                public_id: `slide-${Date.now()}`,
                                resource_type: 'image'
                            }
                        );
                        imageUrl = uploadResult.secure_url;
                    } catch (uploadError) {
                        console.error('이미지 업로드 오류:', uploadError);
                    }
                }

                const newSlide = {
                    id: data.slides.length > 0 ? Math.max(...data.slides.map(s => s.id)) + 1 : 1,
                    image: imageUrl,
                    title: parsedBody.title,
                    description: parsedBody.description,
                    active: parsedBody.active === 'true' || parsedBody.active === true
                };

                data.slides.push(newSlide);
                writeSlides(data);

                return createResponse(200, newSlide);

            case 'PUT':
                // 슬라이드 수정
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                if (!isIdPath) {
                    return createResponse(400, { error: '슬라이드 ID가 필요합니다.' });
                }

                let updateParsedBody;
                let updateImageFile = null;

                // 멀티파트 데이터 처리
                if (headers['content-type'] && headers['content-type'].includes('multipart/form-data')) {
                    const result = await multipart.parse(event);
                    updateParsedBody = result.files ? result : { ...result };
                    updateImageFile = result.files && result.files.length > 0 ? result.files[0] : null;
                } else {
                    updateParsedBody = JSON.parse(body);
                }

                const updateData = readSlides();
                const slideIndex = updateData.slides.findIndex(s => s.id === parseInt(id));

                if (slideIndex === -1) {
                    return createResponse(404, { error: '슬라이드를 찾을 수 없습니다.' });
                }

                const updatedSlide = {
                    ...updateData.slides[slideIndex],
                    title: updateParsedBody.title || updateData.slides[slideIndex].title,
                    description: updateParsedBody.description || updateData.slides[slideIndex].description,
                    active: updateParsedBody.active !== undefined ? (updateParsedBody.active === 'true' || updateParsedBody.active === true) : updateData.slides[slideIndex].active
                };

                // 이미지 업로드 처리
                if (updateImageFile && process.env.CLOUDINARY_CLOUD_NAME) {
                    try {
                        const uploadResult = await cloudinary.uploader.upload(
                            `data:${updateImageFile.contentType};base64,${updateImageFile.content.toString('base64')}`,
                            {
                                folder: 'geumbaeksa/slides',
                                public_id: `slide-${Date.now()}`,
                                resource_type: 'image'
                            }
                        );
                        updatedSlide.image = uploadResult.secure_url;
                    } catch (uploadError) {
                        console.error('이미지 업로드 오류:', uploadError);
                    }
                } else if (updateParsedBody.image) {
                    updatedSlide.image = updateParsedBody.image;
                }

                updateData.slides[slideIndex] = updatedSlide;
                writeSlides(updateData);

                return createResponse(200, updatedSlide);

            case 'DELETE':
                // 슬라이드 삭제
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                if (!isIdPath) {
                    return createResponse(400, { error: '슬라이드 ID가 필요합니다.' });
                }

                const deleteData = readSlides();
                const deleteSlideIndex = deleteData.slides.findIndex(s => s.id === parseInt(id));

                if (deleteSlideIndex === -1) {
                    return createResponse(404, { error: '슬라이드를 찾을 수 없습니다.' });
                }

                const deletedSlide = deleteData.slides[deleteSlideIndex];
                deleteData.slides.splice(deleteSlideIndex, 1);
                writeSlides(deleteData);

                return createResponse(200, { message: '슬라이드가 삭제되었습니다.', deletedSlide });

            default:
                return createResponse(405, { error: '허용되지 않는 메소드입니다.' });
        }
    } catch (error) {
        console.error('슬라이드 API 오류:', error);
        return createResponse(500, { error: '서버 오류가 발생했습니다.' });
    }
}; 