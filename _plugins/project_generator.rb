module Jekyll
  class ProjectPage < Page
    def initialize(site, base, dir, project)
      @site = site
      @base = base
      @dir  = dir
      @name = 'index.html'

      self.process(@name)
      self.process(@name)
      
      # Initialize data hash explicitly since we're not using read_yaml
      self.data ||= {}

      # Set the layout to 'project' (corresponds to _layouts/project.html)
      self.data['layout'] = 'project'
      self.data['priority'] = 0.8
      
      # Set page properties from project data
      self.data['title'] = project['title']
      self.data['description'] = project['description']
      self.data['image'] = project['image']
      self.data['width'] = project['width']
      self.data['height'] = project['height']
      self.data['date'] = project['date']
      self.data['type'] = project['type']
      self.data['context'] = project['context']
      self.data['tags'] = project['tags']
      self.data['gallery'] = project['gallery']

      
      # Set the content of the page
      self.content = project['text']
       # Keep data for Liquid access just in case
      self.data['content'] = project['text']
      
      self.data['projectLink'] = project['projectLink']
      self.data['driveLink'] = project['driveLink']
      self.data['id'] = project['id']
    end
  end

  class ProjectGenerator < Generator
    safe true

    def generate(site)
      if site.data['projects']
        site.data['projects'].each do |project|
          # Create a slug from the title or use provided slug
          slug = project['slug'] || Utils.slugify(project['title'], mode: 'latin')
          
          # Auto-populate gallery from folder if not present
          # Assumes images are in /media/projects/results/<Project Title>/
          # We check the source directory for matching files
          if !project.key?('gallery') || project['gallery'].empty?
             # Try multiple potential folder names
             candidates = [
                project['title'],
                project['title'].strip,
                slug, # slug is typically lowercase-hyphenated "le-guide-du-golfe..."
                project['title'].gsub(' ', '_'),
                project['title'].gsub(' ', ''),
                project['title'].gsub(/[^0-9a-z]/i, '')
             ]
             
             gallery_path_rel = nil
             gallery_path_abs = nil

             candidates.uniq.each do |cand|
                check_rel = File.join('assets', 'media', 'projects', 'results', cand)
                check_abs = File.join(site.source, check_rel)
                if File.directory?(check_abs)
                   gallery_path_rel = check_rel
                   gallery_path_abs = check_abs
                   break
                end
             end
             
             if gallery_path_abs && File.directory?(gallery_path_abs)
                images = []
                images = Dir.glob(File.join(gallery_path_abs, "**", "*.{jpg,jpeg,png,gif,webp,svg}")).map do |file|
                  # Convert absolute path to site-relative path
                  # The glob pattern already filters extensions, so no need for an 'if' here.
                  # Also, File.basename(file) is correct for the file name, but we need the path relative to gallery_path_rel
                  # Example: gallery_path_abs = /site/source/media/projects/results/ProjectA
                  #          file = /site/source/media/projects/results/ProjectA/subdir/image.jpg
                  #          rel_path_from_gallery_root = subdir/image.jpg
                  #          final_rel_path = /media/projects/results/ProjectA/subdir/image.jpg
                  
                  # Calculate the path relative to gallery_path_abs
                  relative_to_gallery_root = Pathname.new(file).relative_path_from(Pathname.new(gallery_path_abs)).to_s
                  
                  # Construct the full site-relative URL
                  "/#{gallery_path_rel.gsub('\\', '/')}/#{relative_to_gallery_root.gsub('\\', '/')}"
                end
                
                # Sort images alphabetically
                project['gallery'] = images.sort
             end
          end


          # Create the page at /creations/slug/
          dir = File.join('creations', slug)
          site.pages << ProjectPage.new(site, site.source, dir, project)
        end
      end
    end
  end
end
