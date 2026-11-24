

const fetchPayment= (orderId,userId,callback)=>{
setTimeout(() => {
    let payment = {orderId,amount:400,quantity:2,unit:"kg"};
    callback(payment);
}, 2000);
}

const fetchorder = (userId,callback)=>{
setTimeout(()=>{
let order = {userId,orderId:1,orderItem: "apple",price:"200",unit:"kg"}
callback(order)

},2000)
};


const fetch  = (callback)=>{
   const user = setTimeout(() => {
     let user = {userId: 1, name: "rup"};
     callback(user);
      
    }, 2000);

};

console.log("fetching user: ");

const userreport = fetch((user)=>{
 fetchorder(user.userId,(order)=>{
    fetchPayment(order.orderId,user.userId,(payment)=>{
console.log(payment);
    });
 })
});



