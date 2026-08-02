const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// function asyncHandler(requestHandler){
//   return function x(req, res, next){

//   }
// }
