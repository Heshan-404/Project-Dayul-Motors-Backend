import pool from "../../utils/database.connection";
export const fetchAllOrders = async (req, res) => {
  try {
    const queryText = `
        SELECT orderstatus, jsonb_agg(json_build_object(
          'orderid', orderid,
          'userid', userid,
          'orderstatus', orderstatus,
          'orderdate', orderdate,
          'paymentmethod', paymentmethod,
          'totalamount', totalamount,
          'ordertime', ordertime
        ) ORDER BY ordertime DESC) as orders
        FROM orders
        GROUP BY orderstatus;
      `;
    const result = await pool.query(queryText);

    const categorizedOrders = {};
    result.rows.forEach((row) => {
      categorizedOrders[row.orderstatus] = {
        count: row.orders.length,
        orders: row.orders,
      };
    });

    res.status(200).json({ categorizedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchOrderDetails = async (req, res) => {
  const { orderid } = req.params;
  try {
    const queryText = `
        SELECT o.orderid, o.orderdate, o.ordertime, o.userid, o.orderstatus, o.paymentmethod, o.totalamount, 
               u.fullname as customer_name, u.email as customer_email, u.phoneno as customer_phone, u.address as customer_address
        FROM orders o
        JOIN users u ON o.userid = u.userid
        WHERE o.orderid = $1;
      `;
    const values = [orderid];
    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
