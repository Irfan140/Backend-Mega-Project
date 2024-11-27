const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

/*

1. When we want to perform some task before reciving the request from the frontend we use backend
2. In utils we make  function for general purpose use...in our utils folder
3. basic of hogher order function
const asyncHandler = () => {}
const asyncHandler = (func) => () => {}
const asyncHandler = (func) => async () => {}



*/



//? Another way of writting asyncHandler in try catch way

/*

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}

*/