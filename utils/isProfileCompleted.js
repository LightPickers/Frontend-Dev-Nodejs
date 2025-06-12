function isProfileCompleted(user) {
  return (
    !!user.gender &&
    !!user.birth_date &&
    !!user.phone &&
    !!user.address_zipcode &&
    !!user.address_city &&
    !!user.address_district &&
    !!user.address_detail
  );
}

module.exports = isProfileCompleted;
