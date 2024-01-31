const User = require('../models/user');
const createUser = async (req, res) => {
  try {
    const { username, email} = req.body;

    const newUser = await User.create({
      username,
      email,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createUser };
