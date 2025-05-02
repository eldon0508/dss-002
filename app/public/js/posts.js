async function loadPosts() {
  const result = await fetch("/latestPosts");
  const data = await result.json();
  document.querySelector("#login_link").textContent = data.user.username;

  const post_data = data.posts;
  let postList = document.getElementById("postsList");

  for (let i = 0; i < postList.children.length; i++) {
    if (postList.children[i].nodeName == "article") {
      postList.removeChild(postList.children[i]);
    }
  }

  post_data.map((post) => {
    let author = post.username;
    let timestamp = new Date(post.created_at).toLocaleString("en-GB");
    let title = post.title;
    let content = post.content;
    let postId = post.id;

    let postContainer = document.createElement("article");
    postContainer.classList.add("post");
    let fig = document.createElement("figure");
    postContainer.appendChild(fig);

    let postIdContainer = document.createElement("p");
    postIdContainer.textContent = postId;
    postIdContainer.hidden = true;
    postContainer.appendChild(postIdContainer);

    let img = document.createElement("img");
    let figcap = document.createElement("figcaption");
    fig.appendChild(img);
    fig.appendChild(figcap);

    let titleContainer = document.createElement("h3");
    titleContainer.textContent = title;
    figcap.appendChild(titleContainer);

    let usernameContainer = document.createElement("h5");
    usernameContainer.textContent = author;
    figcap.appendChild(usernameContainer);

    let timeContainer = document.createElement("h5");
    timeContainer.textContent = timestamp;
    figcap.appendChild(timeContainer);

    let contentContainer = document.createElement("p");
    contentContainer.textContent = content;
    figcap.appendChild(contentContainer);

    postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
  });
}
loadPosts();

async function searchPosts() {
  let searchBar = document.getElementById("search");

  // Get contents of search bar
  let filter = searchBar.value.toUpperCase();

  let postList = document.getElementById("postsList");
  let posts = postList.getElementsByTagName("article");

  // Loop through all posts, and hide ones that don't match the search
  for (i = 0; i < posts.length; i++) {
    // Search body of post
    let content = posts[i].getElementsByTagName("p")[0];
    let postContent = content.textContent || content.innerText;

    // Search title of post
    let title = posts[i].getElementsByTagName("h3")[0];
    let titleContent = title.textContent || title.innerText;

    // Search username
    let username = posts[i].getElementsByTagName("h5")[0];
    let usernameContent = username.textContent || username.innerText;

    // Change display property of posts depending on whether it matches the search or not
    if (
      postContent.toUpperCase().indexOf(filter) > -1 ||
      titleContent.toUpperCase().indexOf(filter) > -1 ||
      usernameContent.toUpperCase().indexOf(filter) > -1
    ) {
      posts[i].style.display = "";
    } else {
      posts[i].style.display = "none";
    }
  }
}

document.getElementById("search").addEventListener("keyup", searchPosts);
