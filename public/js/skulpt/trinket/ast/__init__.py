import _ast

parse = _ast.parse

def _printi(str, depth):
  print "  " * depth + str

def pprint(ast, n=0):
  for key, value in ast.items():
    if key in ["body", "values", "args", "test", "comparators", "left", "func", "value", "names", "generators"]:
      if type(value) is list:
        if len(value) > 0: 
          for v in value:
            pprint(v, n + 1)
        else:
          return
      else:
        pprint(value, n + 1)
    elif key in ["col_offset", "lineno", "_fields"]:
      #printi("Key: " + key + " Value: " + repr(value), n);
      pass
    elif key == "_astname":
      _printi("Type: " + value, n)
    elif key == "name":
      #debugger
      _printi("Name: " + value, n)
      #pass
    else:
      _printi("Key: " + key + " " + repr(value), n)
      
def contains(ast, target_type, recursive = False):
  """Take a Skuplt-parsed ast tree and return whether it has a node with _astname == taget_type"""
  found = False
  for key, value in ast.items():
    if key == "_astname" and value == target_type:
      # Found it.
      return True
    elif key in ["body", "values", "args", "test", "comparators", "left", "func", "value", "names"]:
      # We need to break each of these up and search recursively
      if type(value) is list:
        if len(value) > 0: 
          for v in value:
            found = found or contains(v, target_type, True)
        else:
          # Nothing in the list; Move on
          continue
      elif type(value) is dict:
        found = found or contains(value, target_type, True)
      else: 
        continue
    else:
      continue
  return found
