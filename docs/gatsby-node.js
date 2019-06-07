const path = require("path")

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  const markdownTemplate = path.resolve(`src/templates/markdownTemplate.js`)
  const markdownPage = path.resolve(`src/templates/markdownPage.js`)

  return graphql(`
    {
      allFile(filter: {sourceInstanceName: {eq: "markdown-pages"}, extension: {eq: "md"}}) {
        edges {
          node {
            childMarkdownRemark {
              frontmatter {
                path
              }
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    result.data.allFile.edges.forEach(({ node }) => {

      console.log(node);
      createPage({
        path: node.childMarkdownRemark.frontmatter.path,
        component: markdownPage,
        context: {}, // additional data can be passed via context
      })
    })
  })
}


exports.onCreateWebpackConfig = ({
  stage,
  actions,
}) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.md$/,
          use: [
            {
              loader: 'remark-loader'
            }
          ],
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            minimize: false,
          },
        },
      ],
    },
  })
}