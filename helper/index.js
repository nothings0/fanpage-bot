module.exports = {
  getUserProfile: async (senderId) => {
    try {
      const url = `https://graph.facebook.com/${senderId}?access_token=${process.env.PAGE_ACCESS_TOKEN}`;

      const name = await axios.get(url);
      return name;
    } catch (error) {
      throw error;
    }
  },
};
