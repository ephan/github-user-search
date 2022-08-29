import { Octokit } from "@octokit/rest";
import type { NextApiRequest, NextApiResponse } from 'next'

type SortBy = "followers" | "repositories" | "joined" | undefined;
type SortOrder = "asc" | "desc" | undefined;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q, page, per_page, sort, order } = req.query;

  if (!q) {
    res.status(400).send("Missing query parameter: q");
    return;
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_SECRET,
    });

    // octokit.search.users() returns up to 30 results at a time, but we specify the RESULTS_PER_PAGE
    // this api only returns partial list of user data, we need a 2nd api call to get the full user data
    const searchUserData = await octokit.search.users({
      q: q as string,
      page: page ? parseInt(page as string) : undefined,
      per_page: per_page ? parseInt(<string>per_page) : undefined,
      sort: sort as SortBy,
      order: order as SortOrder,
    });

    if (searchUserData?.data?.items?.length > 0) {
      //computing the total number of pages
      let computedTotalPages = Math.floor(
        (searchUserData?.data?.total_count || 0) / parseInt(<string>per_page)
      );
      if (searchUserData?.data?.items?.length % parseInt(<string>per_page) > 0)
        computedTotalPages++;

      //call second api for each user returned
      const urls = searchUserData?.data?.items.map(
        (user) => `GET /users/${user.login}`
      );

      //Promise.all ensures we get results all at once
      let resultData = await Promise.all(
        urls.map((url) =>
          octokit.request(url, {
            username: "USERNAME",
          })
        )
      );

      if (resultData && Array.isArray(resultData)) {
        const userData: ResultData[] = resultData.map((user) => user.data);

        res
          .status(200)
          .json({ data: userData, totalPages: computedTotalPages });
      } else {
        res.status(500).send("Error fetching user data");
      }
    } else {
      res.status(200).json({ data: [], totalPages: 0 });
    }
  } catch (error) {
    res.status(500).send(error);
  }
}
