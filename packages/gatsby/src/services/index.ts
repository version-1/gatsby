import { customizeSchema } from "./customize-schema"
import { sourceNodes } from "./source-nodes"
import { createPages } from "./create-pages"
import { buildSchema } from "./build-schema"
import { createPagesStatefully } from "./create-pages-statefully"
import { extractQueries } from "./extract-queries"
import { writeOutRequires } from "./write-out-requires"
import { calculateDirtyQueries } from "./calculate-dirty-queries"
import { runStaticQueries } from "./run-static-queries"
import { runPageQueries } from "./run-page-queries"
import { initialize } from "./initialize"
import { writeHTML } from "./write-html"
import { waitUntilAllJobsComplete } from "../utils/wait-until-jobs-complete"
import { ServiceConfig } from "xstate"
import { IBuildContext } from "./"
export * from "./types"

export const buildServices: Record<string, ServiceConfig<IBuildContext>> = {
  customizeSchema,
  sourceNodes,
  createPages,
  buildSchema,
  createPagesStatefully,
  extractQueries,
  writeOutRequires,
  calculateDirtyQueries,
  runStaticQueries,
  runPageQueries,
  initialize,
  writeHTML,
  waitUntilAllJobsComplete,
}