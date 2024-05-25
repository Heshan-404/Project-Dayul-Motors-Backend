import pool from "../../utils/database.connection";

export const passwordReset = async (req, res) => {
  try {
    // Update the password in the database
    const client = await pool.connect();
    const getBrands = "SELECT * FROM brands";
    const getCategories = "SELECT * FROM categories";
    const result = client.query(getBrands, getCategories);
    console.log(result);
    client.release();

    // Send a response indicating success
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
