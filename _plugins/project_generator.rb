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
      
      # Set page properties from project data
      self.data['title'] = project['title']
      self.data['description'] = project['description']
      self.data['image'] = project['image']
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
          # Create a slug from the title
          slug = Utils.slugify(project['title'])
          
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
                project['title'].gsub(' ', '')
             ]
             
             gallery_path_rel = nil
             gallery_path_abs = nil

             candidates.uniq.each do |cand|
                check_rel = File.join('media', 'projects', 'results', cand)
                check_abs = File.join(site.source, check_rel)
                if File.directory?(check_abs)
                   gallery_path_rel = check_rel
                   gallery_path_abs = check_abs
                   break
                end
             end
             
             if gallery_path_abs && File.directory?(gallery_path_abs)
                images = []
                Dir.glob(File.join(gallery_path_abs, '*')).each do |file|
                  ext = File.extname(file).downcase
                  if ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].include?(ext)
                    # Convert absolute path to site-relative path
                    rel_path = "/#{gallery_path_rel.gsub('\\', '/')}/#{File.basename(file)}"
                    images << rel_path
                  end
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
