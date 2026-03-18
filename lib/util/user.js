var SEPARATOR = '-';

/**
 * "generate" username from string
 */
function generate_username(user) {
    return user.replace(/\W+/g, SEPARATOR).toLowerCase();
}

/**
 * "generate" username from string and append random suffix
 */
function generate_username_with_suffix(user) {
  return generate_username(user) + append_random_suffix();
}

/**
 * generate random 4 digit string 
 * return string suitable for appending to a username
 */
function append_random_suffix() {
  var suffix = (Math.floor(Math.random() * 9999)).toString();
  while (suffix.length < 4) {
    suffix = '0' + suffix;
  }

  return SEPARATOR + suffix;
}

module.exports = {
    generate_username             : generate_username
  , generate_username_with_suffix : generate_username_with_suffix
};
