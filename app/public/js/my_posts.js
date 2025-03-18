async function loadMyPosts() {
  const result = await fetch("/loadMyPosts");
  const data = await result.json();
  document.querySelector("#login_link").textContent = data.user.username;

  const post_data = data.posts;
  let postList = document.getElementById("myPosts");

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

    let postIdContainer = document.createElement("h6");
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
    contentContainer.id = "content";
    contentContainer.textContent = content;
    figcap.appendChild(contentContainer);

    let editBtn = document.createElement("button");
    editBtn.classList.add("editBtn");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", editPost);
    postContainer.appendChild(editBtn);

    let delBtn = document.createElement("button");
    delBtn.classList.add("delBtn");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", function (e) {
      deletePost(e, postId);
    });
    postContainer.appendChild(delBtn);

    postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
  });
}

loadMyPosts();

function editPost(e) {
  // Get post that the user clicked on
  let post = e.target.parentNode;

  // Fill out form fields with data grabbed from post
  document.getElementById("title").value = post.getElementsByTagName("h3")[0].textContent;
  document.getElementById("content").value = post.getElementsByTagName("p")[0].textContent;
  document.getElementById("postId").value = post.getElementsByTagName("h6")[0].textContent;

  // Scroll user to post form
  document.getElementById("postForm").scrollIntoView({ behavior: "smooth" });
}

async function deletePost(e, postId) {
  const res = await fetch("/deletePost", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      postId: postId,
    }),
  });

  // Hide element on button click so deletion appears immediate
  e.target.parentNode.hidden = true;
}

async function searchPosts() {
  let searchBar = document.getElementById("search");

  // Get contents of search bar
  let filter = searchBar.value.toUpperCase();

  let postList = document.getElementById("myPosts");
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

document.getElementById("postForm").onsubmit = async function (e) {
  e.preventDefault();

  // Get all form datas
  const formData = new FormData(document.getElementById("postForm"));
  const captchaResponse = formData.get("g-recaptcha-response");
  const title = formData.get("title");
  const content = formData.get("content");
  const postId = formData.get("postId");

  const postError = document.getElementById("post_error");

  try {
    const result = await fetch("/makepost", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        postId,
        captcha: captchaResponse,
      }),
    });
    const data = await result.json();

    if (data.success === false) {
      postError.textContent = data.message;
      postError.classList.add("error");
    } else {
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error(error);
    postError.textContent = "Network error. Please try again later.";
    postError.classList.add("error");
  }
};

document.getElementById("search").addEventListener("keyup", searchPosts);
