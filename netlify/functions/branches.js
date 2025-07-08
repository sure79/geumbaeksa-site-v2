const { requireAuth, createResponse } = require('./utils/data');
const { connectToDatabase, initializeData, getNextId, uploadImageToGridFS, Branch } = require('./utils/mongodb');
const multipart = require('lambda-multipart-parser');

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
                await connectToDatabase();
                await initializeData();
                
                if (isIdPath) {
                    // 특정 지점 조회
                    const branch = await Branch.findOne({ id: parseInt(id) });
                    
                    if (!branch) {
                        return createResponse(404, { error: '지점을 찾을 수 없습니다.' });
                    }
                    
                    return createResponse(200, branch);
                } else {
                    // 모든 지점 조회
                    const branches = await Branch.find().sort({ id: 1 });
                    return createResponse(200, branches);
                }

            case 'POST':
                // 지점 추가
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                await connectToDatabase();
                await initializeData();

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

                let imageUrl = parsedBody.image || '/korea-map.svg';

                // 이미지 업로드 처리
                if (imageFile) {
                    try {
                        const filename = `branch-${Date.now()}-${imageFile.filename || 'image.jpg'}`;
                        imageUrl = await uploadImageToGridFS(
                            imageFile.content,
                            filename,
                            imageFile.contentType || 'image/jpeg'
                        );
                    } catch (uploadError) {
                        console.error('이미지 업로드 오류:', uploadError);
                    }
                }

                const nextId = await getNextId(Branch);
                const newBranch = new Branch({
                    id: nextId,
                    name: parsedBody.name,
                    address: parsedBody.address,
                    phone: parsedBody.phone,
                    hours: parsedBody.hours,
                    image: imageUrl,
                    description: parsedBody.description,
                    features: parsedBody.features ? parsedBody.features.split(',').map(f => f.trim()) : [],
                    lat: parseFloat(parsedBody.lat) || 37.5665,
                    lng: parseFloat(parsedBody.lng) || 126.9780
                });

                const savedBranch = await newBranch.save();
                return createResponse(200, savedBranch);

            case 'PUT':
                // 지점 수정
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                if (!isIdPath) {
                    return createResponse(400, { error: '지점 ID가 필요합니다.' });
                }

                await connectToDatabase();
                await initializeData();

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

                const existingBranch = await Branch.findOne({ id: parseInt(id) });
                if (!existingBranch) {
                    return createResponse(404, { error: '지점을 찾을 수 없습니다.' });
                }

                const updateData = {
                    name: updateParsedBody.name || existingBranch.name,
                    address: updateParsedBody.address || existingBranch.address,
                    phone: updateParsedBody.phone || existingBranch.phone,
                    hours: updateParsedBody.hours || existingBranch.hours,
                    description: updateParsedBody.description || existingBranch.description,
                    features: updateParsedBody.features ? updateParsedBody.features.split(',').map(f => f.trim()) : existingBranch.features,
                    lat: updateParsedBody.lat ? parseFloat(updateParsedBody.lat) : existingBranch.lat,
                    lng: updateParsedBody.lng ? parseFloat(updateParsedBody.lng) : existingBranch.lng
                };

                // 이미지 업로드 처리
                if (updateImageFile) {
                    try {
                        const filename = `branch-${Date.now()}-${updateImageFile.filename || 'image.jpg'}`;
                        updateData.image = await uploadImageToGridFS(
                            updateImageFile.content,
                            filename,
                            updateImageFile.contentType || 'image/jpeg'
                        );
                    } catch (uploadError) {
                        console.error('이미지 업로드 오류:', uploadError);
                    }
                } else if (updateParsedBody.image) {
                    updateData.image = updateParsedBody.image;
                }

                const updatedBranch = await Branch.findOneAndUpdate(
                    { id: parseInt(id) },
                    updateData,
                    { new: true }
                );

                return createResponse(200, updatedBranch);

            case 'DELETE':
                // 지점 삭제
                if (!requireAuth(headers)) {
                    return createResponse(401, { error: '관리자 권한이 필요합니다.' });
                }

                if (!isIdPath) {
                    return createResponse(400, { error: '지점 ID가 필요합니다.' });
                }

                await connectToDatabase();
                await initializeData();

                const deletedBranch = await Branch.findOneAndDelete({ id: parseInt(id) });

                if (!deletedBranch) {
                    return createResponse(404, { error: '지점을 찾을 수 없습니다.' });
                }

                return createResponse(200, { message: '지점이 삭제되었습니다.', deletedBranch });

            default:
                return createResponse(405, { error: '허용되지 않는 메소드입니다.' });
        }
    } catch (error) {
        console.error('지점 API 오류:', error);
        return createResponse(500, { error: '서버 오류가 발생했습니다.' });
    }
}; 