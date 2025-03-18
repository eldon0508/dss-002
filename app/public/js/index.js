async function displayUsername() {
  const res = await fetch("/index");
  const data = await res.json();
  document.querySelector("#login_link").textContent = data.user.username;

  const post_data = data.posts;
  let postList = document.getElementById("postsList");

  // Remove current posts
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
    postId.id = "postId";
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

displayUsername();
