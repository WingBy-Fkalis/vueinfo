function findVueRoot(root) {
  const queue = [root];
  while (queue.length > 0) {
    const currentNode = queue.shift();

    if (currentNode.__vue__ || currentNode.__vue_app__ || currentNode._vnode) {
      console.log("vue detected on root element:", currentNode);
      return currentNode
    }

    for (let i = 0; i < currentNode.childNodes.length; i++) {
      queue.push(currentNode.childNodes[i]);
    }
  }

  return null;
}

function findVueRouter(vueRoot) {
  let router;

  try {
    if (vueRoot.__vue_app__) {
      router = vueRoot.__vue_app__.config.globalProperties.$router.options.routes
      console.log("find router in Vue object", vueRoot.__vue_app__)
    } else if (vueRoot.__vue__) {
      router = vueRoot.__vue__.$root.$options.router.options.routes
      console.log("find router in Vue object", vueRoot.__vue__)
    }
  } catch (e) {}

  try {
    if (vueRoot.__vue__ && !router) {
      router = vueRoot.__vue__._router.options.routes
      console.log("find router in Vue object", vueRoot.__vue__)
    }
  } catch (e) {}

  return router
}

function walkRouter(rootNode, callback) {
  const stack = [{ node: rootNode, path: '' }];

  while (stack.length) {
    const { node, path } = stack.pop();

    if (node && typeof node === 'object') {
      if (Array.isArray(node)) {
        for (const key in node) {
          // (修复代码1)Ensure node[key] is an object and has a path property before pushing to stack
          if (node[key] && typeof node[key] === 'object' && 'path' in node[key]) {
            stack.push({ node: node[key], path: mergePath(path, node[key].path) });
          }
        }
      } else if (node.hasOwnProperty("children")) {
        stack.push({ node: node.children, path: path });
      }
    }

    // Only call callback if node is defined and has a path property
    if (node && node.path !== undefined) {
      callback(path, node);
    }
  }
}

function mergePath(parent, path) {
  // (修复代码2)Check if path is undefined or null before processing
  if (typeof path === 'undefined' || path === null) {
    return parent ? parent + '/' : '';
  }

  // 报错位置
  if (path.indexOf(parent) === 0) {
    return path;
  }

  return (parent ? parent + '/' : '') + path;
}
function main() {
  const vueRoot = findVueRoot(document.body);
  if (!vueRoot) {
    console.error("This website is not developed by Vue")
    return
  }

  let vueVersion;
  if (vueRoot.__vue__) {
    vueVersion = vueRoot.__vue__.$options._base.version;
  } else {
    vueVersion = vueRoot.__vue_app__.version;
  }

  console.log("Vue version is ", vueVersion)
  const routers = [];

  const vueRouter = findVueRouter(vueRoot)
  if (!vueRouter) {
    console.error("No Vue-Router detected")
    return
  }

  console.log(vueRouter)
  walkRouter(vueRouter, function (path, node) {
    if (node.path) {
      routers.push({name: node.name, path})
    }
  })

  return routers
}
console.table(main())
