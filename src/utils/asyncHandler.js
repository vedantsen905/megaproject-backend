const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        promise.reslove(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}
export default asyncHandler


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.status || 500).json({
//             message: error.message || 'Something went wrong '
//         })
        
//     }

// }
